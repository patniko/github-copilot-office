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
  
  // Create HTTPS server first
  const fs = require('fs');
  const certPath = path.resolve(__dirname, '../certs/localhost.pem');
  const keyPath = path.resolve(__dirname, '../certs/localhost-key.pem');
  
  const httpsConfig = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
  };
  
  const PORT = 3000;
  const httpsServer = https.createServer(httpsConfig, app);
  
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



