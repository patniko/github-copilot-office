const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');
const fs = require('fs');

// Read SSL certificates
const certPath = path.resolve(__dirname, 'certs/localhost.pem');
const keyPath = path.resolve(__dirname, 'certs/localhost-key.pem');

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  throw new Error(`SSL certificates not found. Expected:\n  ${certPath}\n  ${keyPath}`);
}

const httpsConfig = {
  cert: fs.readFileSync(certPath),
  key: fs.readFileSync(keyPath),
};

module.exports = defineConfig({
  plugins: [react.default()],
  root: 'src/ui',
  publicDir: 'public',
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
    strictPort: true,
    https: httpsConfig,
    hmr: {
      protocol: 'wss',
      host: 'localhost',
      port: 3000,
    },
  },
  resolve: {
    alias: {
      'copilot-sdk': path.resolve(__dirname, '../../../github/copilot-agent-runtime/copilot-sdk/nodejs/src'),
    },
  },
});
