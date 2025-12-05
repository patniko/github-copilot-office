const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');
const path = require('path');

// Resolve the @github/copilot bin entry point
const COPILOT_MODULE = path.resolve(__dirname, '../node_modules/@github/copilot/index.js');

function setupCopilotProxy(httpsServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpsServer.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `https://${request.headers.host}`);
    
    if (url.pathname === '/api/copilot') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
    // Let other WebSocket connections (e.g., Vite HMR) pass through
  });

  wss.on('connection', (ws) => {
    const child = spawn(process.execPath, [COPILOT_MODULE, '--server', '--stdio'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    child.on('error', () => {
      ws.close(1011, 'Child process error');
    });

    child.on('exit', () => {
      ws.close(1000, 'Child process exited');
    });

    // Buffer for incomplete LSP messages
    let buffer = Buffer.alloc(0);

    // Proxy child stdout -> WebSocket (buffer complete LSP messages)
    child.stdout.on('data', (data) => {
      buffer = Buffer.concat([buffer, data]);
      
      // Process complete messages from buffer
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
        
        if (ws.readyState === ws.OPEN) {
          ws.send(message);
        }
      }
    });

    // Proxy WebSocket -> child stdin
    ws.on('message', (data) => {
      if (!child.killed) {
        child.stdin.write(data);
      }
    });

    ws.on('close', () => {
      if (!child.killed) {
        child.kill();
      }
    });

    ws.on('error', () => {
      if (!child.killed) {
        child.kill();
      }
    });
  });
}

module.exports = { setupCopilotProxy };
