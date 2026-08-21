const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');
const net = require('net');
const { resolveCopilotBinary } = require('./copilotBinary');

/**
 * Spawn the Copilot CLI process in JSON-RPC server mode.
 *
 * The CLI is a self-contained native executable, so it is spawned directly. This works
 * identically under Electron — the previous ELECTRON_RUN_AS_NODE argv-rewriting wrapper
 * was only needed back when the CLI shipped as a JavaScript bundle run through Node.
 */
function spawnCopilotProcess() {
  const binary = resolveCopilotBinary();

  // The native binary must not inherit Electron's Node-mode flag from the host process.
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;

  return spawn(binary, ['--server', '--stdio'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env,
  });
}

/**
 * Connect to an existing Copilot runtime over TCP.
 * Returns a net.Socket that speaks the same LSP protocol as stdio.
 */
function connectToRemoteRuntime(host, port) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port }, () => {
      console.log(`[copilot-remote] Connected to runtime at ${host}:${port}`);
      resolve(socket);
    });
    socket.on('error', (err) => {
      reject(new Error(`Failed to connect to runtime at ${host}:${port}: ${err.message}`));
    });
  });
}

/**
 * Buffer and forward complete LSP messages from a readable stream to WebSocket.
 * Shared by both local (child.stdout) and remote (TCP socket) modes.
 */
function pipeLspToWebSocket(readable, ws, label) {
  let buffer = Buffer.alloc(0);

  readable.on('data', (data) => {
    buffer = Buffer.concat([buffer, data]);
    
    let iterations = 0;
    while (iterations++ < 100) {
      const headerEnd = buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) break;
      
      const header = buffer.slice(0, headerEnd).toString('utf8');
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        buffer = buffer.slice(headerEnd + 4);
        continue;
      }
      
      const contentLength = parseInt(match[1], 10);
      const messageEnd = headerEnd + 4 + contentLength;
      
      if (buffer.length < messageEnd) break;
      
      const message = buffer.slice(0, messageEnd);
      buffer = buffer.slice(messageEnd);

      // Log messages for debugging
      try {
        const body = message.slice(headerEnd + 4).toString('utf8');
        const json = JSON.parse(body);
        if (json.method === 'session.event') {
          const ev = json.params?.event;
          if (ev) {
            const preview = ev.type === 'assistant.message_delta'
              ? (ev.data?.deltaContent || '').slice(0, 60)
              : ev.type === 'session.error'
              ? (ev.data?.message || JSON.stringify(ev.data)).slice(0, 100)
              : ev.type === 'external_tool.requested'
              ? `${ev.data?.toolName || ''}`
              : ev.type === 'permission.requested'
              ? `${ev.data?.permissionRequest?.kind || ''} ${ev.data?.permissionRequest?.intention || ''}`
              : '';
            console.log(`[${label}→ws] ${ev.type}${preview ? ' ' + preview : ''}`);
          }
        } else if (json.method) {
          console.log(`[${label}→ws] ${json.method}`);
        }
      } catch {}
      
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    }
  });
}

function setupCopilotProxy(httpsServer) {
  const wss = new WebSocketServer({ noServer: true });

  const upgradeHandler = (request, socket, head) => {
    const url = new URL(request.url, `https://${request.headers.host}`);
    
    if (url.pathname === '/api/copilot') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
    // Let other WebSocket connections (e.g., Vite HMR) pass through
  };

  httpsServer.on('upgrade', upgradeHandler);

  // Store cleanup function on the server
  httpsServer.closeWebSockets = () => {
    wss.clients.forEach(client => client.terminate());
    wss.close();
  };

  wss.on('connection', (ws, request) => {
    const url = new URL(request.url, `https://${request.headers.host}`);
    const mode = url.searchParams.get('mode');
    const remoteHost = url.searchParams.get('host') || 'localhost';
    const remotePort = parseInt(url.searchParams.get('port') || '19900', 10);

    if (mode === 'remote') {
      // Remote mode: connect to an existing Copilot runtime via TCP
      handleRemoteConnection(ws, remoteHost, remotePort);
    } else {
      // Local mode: spawn a new CLI process (existing behavior)
      handleLocalConnection(ws);
    }
  });
}

/**
 * Local mode: spawn a Copilot CLI process and pipe stdio ↔ WebSocket.
 */
function handleLocalConnection(ws) {
  let child;
  try {
    child = spawnCopilotProcess();
  } catch (err) {
    console.error('[copilot-cli]', err.message);
    ws.close(1011, 'Copilot CLI binary not found');
    return;
  }

  child.on('error', () => {
    ws.close(1011, 'Child process error');
  });

  child.stderr.on('data', (data) => {
    console.error('[copilot-cli stderr]', data.toString().trim());
  });

  child.on('exit', (code) => {
    console.log(`[copilot-cli] exited with code ${code}`);
    ws.close(1000, 'Child process exited');
  });

  pipeLspToWebSocket(child.stdout, ws, 'proxy');

  ws.on('message', (data) => {
    if (!child.killed) {
      child.stdin.write(data);
    }
  });

  ws.on('close', () => {
    if (!child.killed) child.kill();
  });

  ws.on('error', () => {
    if (!child.killed) child.kill();
  });
}

/**
 * Remote mode: connect to an existing Copilot runtime over TCP and pipe ↔ WebSocket.
 */
function handleRemoteConnection(ws, host, port) {
  console.log(`[copilot-remote] Connecting to runtime at ${host}:${port}...`);
  
  connectToRemoteRuntime(host, port).then((socket) => {
    pipeLspToWebSocket(socket, ws, 'remote');

    ws.on('message', (data) => {
      if (!socket.destroyed) {
        socket.write(data);
      }
    });

    socket.on('close', () => {
      console.log('[copilot-remote] TCP connection closed');
      ws.close(1000, 'Remote runtime disconnected');
    });

    socket.on('error', (err) => {
      console.error('[copilot-remote] TCP error:', err.message);
      ws.close(1011, 'Remote runtime error');
    });

    ws.on('close', () => {
      if (!socket.destroyed) socket.destroy();
    });

    ws.on('error', () => {
      if (!socket.destroyed) socket.destroy();
    });
  }).catch((err) => {
    console.error('[copilot-remote]', err.message);
    // Send error as a WebSocket close with reason
    ws.close(1011, err.message);
  });
}

module.exports = { setupCopilotProxy };
