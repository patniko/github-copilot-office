/**
 * Production server for Office Add-in
 * This serves the pre-built static files (no Vite dev server)
 */
const express = require('express');
const https = require('https');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { setupCopilotProxy } = require('./copilotProxy');

// Determine if we're running from pkg bundle
const isPkg = typeof process.pkg !== 'undefined';

// Get the base directory (works both in dev and when packaged)
function getBasePath() {
  // Check if running from Electron tray app
  if (process.env.COPILOT_OFFICE_BASE_PATH) {
    return process.env.COPILOT_OFFICE_BASE_PATH;
  }
  if (isPkg) {
    // When packaged, __dirname points to snapshot filesystem
    // The actual files are next to the executable
    return path.dirname(process.execPath);
  }
  return path.resolve(__dirname, '..');
}

const BASE_PATH = getBasePath();

async function createServer() {
  const app = express();
  
  // ========== Backend API Routes ==========
  const apiRouter = express.Router();
  apiRouter.use(express.json({ limit: '50mb' }));
  
  apiRouter.get('/hello', (req, res) => {
    res.json({ message: 'Hello from backend!', timestamp: new Date().toISOString() });
  });

  apiRouter.post('/upload-image', async (req, res) => {
    try {
      const { dataUrl, name } = req.body;
      
      if (!dataUrl || !dataUrl.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Invalid image data' });
      }

      const matches = dataUrl.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Invalid data URL format' });
      }

      const extension = matches[1] === 'svg+xml' ? 'svg' : matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      const tempDir = path.join(os.tmpdir(), 'copilot-office-images');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const filename = name || `image-${Date.now()}.${extension}`;
      const filepath = path.join(tempDir, filename);
      fs.writeFileSync(filepath, buffer);

      res.json({ path: filepath, name: filename });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message });
    }
  });

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

  app.use('/api', apiRouter);

  // ========== Static File Serving ==========
  const distPath = path.join(BASE_PATH, 'dist');
  app.use(express.static(distPath));
  
  // Fallback to index.html for SPA routing
  app.get('*path', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  // ========== HTTPS Server ==========
  const certPath = path.join(BASE_PATH, 'certs', 'localhost.pem');
  const keyPath = path.join(BASE_PATH, 'certs', 'localhost-key.pem');
  
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.error('SSL certificates not found!');
    console.error('Expected:', certPath);
    console.error('Expected:', keyPath);
    process.exit(1);
  }
  
  const httpsConfig = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
  };
  
  const PORT = process.env.PORT || 52390;
  const httpsServer = https.createServer(httpsConfig, app);

  setupCopilotProxy(httpsServer);

  httpsServer.listen(PORT, () => {
    console.log(`GitHub Copilot Office Add-in Server running on https://localhost:${PORT}`);
  });

  return httpsServer;
}

// Export for use by tray app
module.exports = { createServer };

// Run directly if not required as a module
if (require.main === module) {
  createServer().catch(console.error);
}
