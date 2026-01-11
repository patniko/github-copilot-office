# GitHub Copilot Office Add-in

A Microsoft Office add-in that integrates GitHub Copilot into Word, Excel, and PowerPoint.

## Quick Start (Development)

```bash
# Install dependencies
npm install

# Register the add-in (one-time setup)
./register.sh        # macOS
.\register.ps1       # Windows

# Start the dev server
npm run dev
```

Then open Word, Excel, or PowerPoint and look for the **GitHub Copilot** button on the Home ribbon.

## Building Installers

Create standalone installers that bundle everything users need—no Node.js required.

### Prerequisites

- Node.js 18+
- **Windows**: [Inno Setup 6](https://jrsoftware.org/isinfo.php)
- **macOS**: Xcode Command Line Tools (`xcode-select --install`)

### Build Commands

```bash
# Build both platforms
npm run build:installer

# Build individually
npm run build:macos      # → build/macos/CopilotOfficeAddin-1.0.0.pkg
npm run build:windows    # → build/windows/CopilotOfficeAddin-Setup-1.0.0.exe

# Build Electron installer (with system tray support)
npm run build:electron:win   # → build/electron/GitHub Copilot Office Add-in Setup 1.0.0.exe
npm run build:electron:mac   # → build/electron/GitHub Copilot Office Add-in-1.0.0.dmg
```

### What the Installers Do

| Step | Windows | macOS |
|------|---------|-------|
| Install location | `C:\Program Files\GitHub Copilot Office Add-in\` | `/Applications/GitHub Copilot Office Add-in/` |
| Trust SSL cert | User's Root store | System keychain |
| Register with Office | Registry key | wef folders |
| Auto-start | Registry Run key | LaunchAgent |
| Background service | ✓ System tray on port 52390 | ✓ Menu bar on port 52390 |

Users just run the installer, then open Office—the add-in appears automatically.

See [installer/README.md](installer/README.md) for detailed build instructions, code signing, and troubleshooting.

## Project Structure

```
├── src/
│   ├── server.js          # Dev server (Vite + Express)
│   ├── server-prod.js     # Production server (static files)
│   ├── copilotProxy.js    # WebSocket proxy for Copilot SDK
│   └── ui/                # React frontend
├── dist/                  # Built frontend assets
├── certs/                 # SSL certificates for localhost
├── manifest.xml           # Office add-in manifest
├── installer/             # Build scripts for installers
│   ├── macos/             # macOS .pkg builder
│   └── windows/           # Windows .exe builder (Inno Setup)
├── register.sh/.ps1       # Dev setup scripts
└── unregister.sh/.ps1     # Dev cleanup scripts
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build frontend for production |
| `npm run start` | Run production server |
| `npm run build:installer` | Build installers for both platforms |
| `npm run build:macos` | Build macOS .pkg installer |
| `npm run build:windows` | Build Windows .exe installer |

## Uninstalling

### Development
```bash
./unregister.sh      # macOS
.\unregister.ps1     # Windows
```

### Installed Version
- **Windows**: Use "Add or Remove Programs"
- **macOS**: Run `sudo /Applications/GitHub\ Copilot\ Office\ Add-in/../installer/macos/uninstall.sh` or see [installer/README.md](installer/README.md)

## Troubleshooting

### Add-in not appearing
1. Ensure the server is running: visit https://localhost:52390 (production) or https://localhost:3000 (development)
2. Look for the GitHub Copilot icon in the system tray (Windows) or menu bar (macOS)
3. Restart the Office application
4. Clear Office cache and try again

### SSL Certificate errors
1. Re-run the register script or installer
2. Or manually trust `certs/localhost.pem`

### Service not starting after install
- **Windows**: Check Task Scheduler for "CopilotOfficeAddin"
- **macOS**: Run `launchctl list | grep copilot` and check `/tmp/copilot-office-addin.log`
