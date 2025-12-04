const express = require('express');
const https = require('https');
const { createServer: createViteServer } = require('vite');
const path = require('path');

async function createServer() {
  const app = express();
  app.use(express.json());

  // ========== Backend API Routes ==========
  
  // Simple test endpoint
  app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from backend!', timestamp: new Date().toISOString() });
  });

  // ========== Vite Dev Server (Frontend) ==========
  
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
    configFile: path.resolve(__dirname, '../vite.config.js'),
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  // Get the HTTPS config from Vite
  const { https: httpsConfig } = vite.config.server;

  if (!httpsConfig) {
    throw new Error('HTTPS configuration is required but not found in Vite config');
  }

  const PORT = 3000;
  
  // Create HTTPS server
  const httpsServer = https.createServer(httpsConfig, app);
  httpsServer.listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
    console.log(`API available at https://localhost:${PORT}/api`);
  });
}

createServer().catch(console.error);



