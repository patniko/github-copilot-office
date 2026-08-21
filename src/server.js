const express = require('express');
const https = require('https');
const { createServer: createViteServer } = require('vite');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { setupCopilotProxy } = require('./copilotProxy');
const { resolveCopilotSdkTypes } = require('./copilotBinary');

async function createServer() {
  const app = express();
  
  // ========== Backend API Routes ==========
  const apiRouter = express.Router();
  apiRouter.use(express.json({ limit: '50mb' }));
  
  // Simple test endpoint
  apiRouter.get('/hello', (req, res) => {
    res.json({ message: 'Hello from backend!', timestamp: new Date().toISOString() });
  });

  // Upload image from base64 data URL
  apiRouter.post('/upload-image', async (req, res) => {
    try {
      const { dataUrl, name } = req.body;
      
      if (!dataUrl || !dataUrl.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Invalid image data' });
      }

      // Extract base64 data
      const matches = dataUrl.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Invalid data URL format' });
      }

      const extension = matches[1] === 'svg+xml' ? 'svg' : matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      // Create temp directory if it doesn't exist
      const tempDir = path.join(os.tmpdir(), 'copilot-office-images');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Generate unique filename
      const filename = name || `image-${Date.now()}.${extension}`;
      const filepath = path.join(tempDir, filename);

      // Write file
      fs.writeFileSync(filepath, buffer);

      res.json({ path: filepath, name: filename });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy for web fetch (GET only, avoids CORS)
  apiRouter.get('/fetch', async (req, res) => {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }
    try {
      const https = require('https');
      const http = require('http');
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        headers: {
          'User-Agent': 'WordAddinDemo/1.0 (https://github.com; contact@example.com)'
        }
      };
      
      client.get(options, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          res.type('text/plain').send(data);
        });
      }).on('error', (e) => {
        res.status(500).json({ error: e.message });
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Remote logging endpoint — prints client-side errors to the server console
  apiRouter.post('/log', (req, res) => {
    const { level = 'error', tag = 'client', message, detail } = req.body || {};
    const prefix = `[${tag}]`;
    if (level === 'error') {
      console.error(prefix, message, detail || '');
    } else {
      console.log(prefix, message, detail || '');
    }
    res.sendStatus(204);
  });

  // List available models by reading from the Copilot CLI's bundled SDK type declarations
  apiRouter.get('/models', (req, res) => {
    try {
      const sdkTypes = resolveCopilotSdkTypes();
      if (!sdkTypes) {
        return res.status(500).json({ error: 'Copilot CLI platform package not found' });
      }
      const content = fs.readFileSync(sdkTypes, 'utf8');
      const match = content.match(/SUPPORTED_MODELS:\s*readonly\s*\[([^\]]+)\]/);
      if (!match) {
        return res.status(500).json({ error: 'Could not parse SUPPORTED_MODELS from SDK' });
      }
      const models = match[1].match(/"([^"]+)"/g).map(s => s.replace(/"/g, ''));
      res.json({ models });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Browse directories for the folder picker
  apiRouter.get('/browse', (req, res) => {
    try {
      const dir = req.query.path || os.homedir();
      const resolved = path.resolve(String(dir));
      if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
        return res.status(400).json({ error: 'Not a directory', path: resolved });
      }
      const entries = fs.readdirSync(resolved, { withFileTypes: true });
      const dirs = entries
        .filter(e => e.isDirectory() && !e.name.startsWith('.'))
        .map(e => e.name)
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      const parent = path.dirname(resolved);
      res.json({ path: resolved, parent: parent !== resolved ? parent : null, dirs });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Read a file from disk (text content, with size limit)
  apiRouter.get('/read-file', (req, res) => {
    try {
      const filePath = req.query.path;
      if (!filePath) {
        return res.status(400).json({ error: 'Missing path parameter' });
      }
      const resolved = path.resolve(String(filePath));
      if (!fs.existsSync(resolved)) {
        return res.status(404).json({ error: 'File not found', path: resolved });
      }
      const stat = fs.statSync(resolved);
      if (stat.isDirectory()) {
        return res.status(400).json({ error: 'Path is a directory, not a file', path: resolved });
      }
      const MAX_SIZE = 1024 * 1024; // 1 MB
      if (stat.size > MAX_SIZE) {
        return res.status(413).json({ error: `File too large (${(stat.size / 1024).toFixed(0)} KB). Max is 1 MB.`, path: resolved });
      }
      const content = fs.readFileSync(resolved, 'utf8');
      res.json({ path: resolved, size: stat.size, content });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // List files and directories at a path
  apiRouter.get('/list-directory', (req, res) => {
    try {
      const dir = req.query.path || os.homedir();
      const resolved = path.resolve(String(dir));
      if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
        return res.status(400).json({ error: 'Not a directory', path: resolved });
      }
      const entries = fs.readdirSync(resolved, { withFileTypes: true });
      const items = entries
        .filter(e => !e.name.startsWith('.'))
        .map(e => ({ name: e.name, type: e.isDirectory() ? 'directory' : 'file' }))
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
          return a.localeCompare(b, undefined, { sensitivity: 'base' });
        });
      res.json({ path: resolved, entries: items });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get server's cwd and home for initial folder picker location
  apiRouter.get('/env', (req, res) => {
    res.json({ cwd: process.cwd(), home: os.homedir() });
  });

  app.use('/api', apiRouter);

  // ========== Vite Dev Server (Frontend) ==========
  
  // Create HTTPS server first
  const certPath = path.resolve(__dirname, '../certs/localhost.pem');
  const keyPath = path.resolve(__dirname, '../certs/localhost-key.pem');
  
  const httpsConfig = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
  };
  
  const PORT = 52390;
  const httpsServer = https.createServer(httpsConfig, app);

  // Setup WebSocket proxy for Copilot
  setupCopilotProxy(httpsServer);
  
  const vite = await createViteServer({
    server: { 
      middlewareMode: true,
      hmr: {
        server: httpsServer,
      },
    },
    appType: 'spa',
    configFile: path.resolve(__dirname, '../vite.config.js'),
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  httpsServer.listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
    console.log(`API available at https://localhost:${PORT}/api`);
  });
}

createServer().catch(console.error);



