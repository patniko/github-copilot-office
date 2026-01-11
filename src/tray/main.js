/**
 * Electron System Tray App for GitHub Copilot Office Add-in
 * Runs the server in the background with a tray icon
 */
const { app, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// Hide from dock on macOS
if (process.platform === 'darwin') {
  app.dock.hide();
}

let tray = null;
let server = null;
let serverRunning = false;

// Get the resources path (works both in dev and when packaged)
function getResourcesPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath);
  }
  return path.resolve(__dirname, '../..');
}

function getIconPath() {
  const resourcesPath = getResourcesPath();
  
  if (process.platform === 'darwin') {
    // macOS: use Template image for proper menu bar appearance
    return path.join(resourcesPath, 'assets', 'tray-iconTemplate.png');
  } else {
    // Windows: use .ico
    return path.join(resourcesPath, 'assets', 'tray-icon.ico');
  }
}

async function startServer() {
  try {
    // Set environment for the server to find its assets
    process.env.COPILOT_OFFICE_BASE_PATH = getResourcesPath();
    
    // Clear the module cache to allow re-requiring after stop
    const serverModulePath = require.resolve('../server-prod.js');
    delete require.cache[serverModulePath];
    
    // Import and start the server
    const { createServer } = require('../server-prod.js');
    server = await createServer();
    serverRunning = true;
    console.log('Server started successfully');
    updateTrayMenu();
  } catch (error) {
    console.error('Failed to start server:', error);
    serverRunning = false;
    updateTrayMenu();
  }
}

async function stopServer() {
  if (server) {
    return new Promise((resolve) => {
      // Close WebSocket connections first
      if (server.closeWebSockets) {
        server.closeWebSockets();
      }
      
      // Force close all connections
      server.closeAllConnections();
      
      server.close(() => {
        server = null;
        serverRunning = false;
        console.log('Server stopped');
        updateTrayMenu();
        resolve();
      });
    });
  }
}

async function toggleServer() {
  if (serverRunning) {
    await stopServer();
  } else {
    await startServer();
  }
}

function updateTrayMenu() {
  if (!tray) return;
  
  const statusLabel = serverRunning ? '● Service Running' : '○ Service Stopped';
  const toggleLabel = serverRunning ? 'Disable Service' : 'Enable Service';
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'GitHub Copilot Office Add-in',
      enabled: false
    },
    { type: 'separator' },
    {
      label: statusLabel,
      enabled: false
    },
    {
      label: toggleLabel,
      click: () => toggleServer()
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip(`GitHub Copilot Office Add-in - ${serverRunning ? 'Running' : 'Stopped'}`);
}

function createTray() {
  const iconPath = getIconPath();
  let icon;
  
  try {
    icon = nativeImage.createFromPath(iconPath);
    // For macOS menu bar, resize to 16x16 or 22x22
    if (process.platform === 'darwin') {
      icon = icon.resize({ width: 16, height: 16 });
      icon.setTemplateImage(true);
    }
  } catch (error) {
    console.error('Failed to load tray icon:', error);
    // Create a simple fallback icon
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('GitHub Copilot Office Add-in - Starting...');

  // Initial menu (will be updated after server starts)
  updateTrayMenu();
  
  // On Windows, clicking the tray icon shows the menu
  if (process.platform === 'win32') {
    tray.on('click', () => {
      tray.popUpContextMenu();
    });
  }
}

app.whenReady().then(async () => {
  createTray();
  await startServer();
});

app.on('window-all-closed', (e) => {
  // Prevent app from quitting when no windows are open
  e.preventDefault();
});

app.on('before-quit', () => {
  // Cleanup if needed
  if (server && server.close) {
    server.close();
  }
});
