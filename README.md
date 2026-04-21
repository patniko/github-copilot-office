# GitHub Copilot Office Add-in

A Microsoft Office add-in that integrates GitHub Copilot into Word, Excel, and PowerPoint.

## Fork / Reference

This project is based on the open-source repository:

- **Reference project:** `patniko/github-copilot-office`

This fork keeps the original Office add-in idea and extends it for local use and publishing.

## What changed in this fork

- Added a safer local file upload flow for chat attachments
- Kept image paste/upload support and made it work through a shared upload helper
- Improved the PowerPoint/Office setup notes so the deployment flow is clearer
- Added documentation that explains the reference project and the fork-specific changes
- Tuned the local development flow so the add-in is easier to run and verify on Windows

## Getting Started

**👉 See [GETTING_STARTED.md](GETTING_STARTED.md) for setup instructions.**

**📖 See [TOOLS_CATALOG.md](TOOLS_CATALOG.md) for available Copilot tools.**

The getting started guide walks you through running the add-in locally using the tray app. Standalone installers are in development and will be available once code signing is complete.

## Office Videos

### PowerPoint

https://github.com/user-attachments/assets/4c2731e4-e157-4968-842f-e496a6e8ed8b

### Excel


https://github.com/user-attachments/assets/42478d69-fd26-415e-8ef7-4efe8450d695

### Word

https://github.com/user-attachments/assets/41408f8d-a9b8-45b6-a826-f50931c7c249

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
├── installer/             # Installer resources (Electron Builder)
│   ├── macos/             # macOS post-install scripts
│   └── windows/           # Windows NSIS scripts
├── register.sh/.ps1       # Setup scripts (trust cert, register manifest)
└── unregister.sh/.ps1     # Cleanup scripts
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run start` | Run production server standalone |
| `npm run start:tray` | Run Electron tray app locally |
| `npm run build` | Build frontend for production |
| `npm run build:installer` | Build installer for current platform |
| `npm run build:installer:mac` | Build macOS .dmg installer |
| `npm run build:installer:win` | Build Windows .exe installer |

## Unregistering Add-in

```bash
./unregister.sh      # macOS
.\unregister.ps1     # Windows
```

## Troubleshooting

### Add-in not appearing
1. Ensure the server is running: visit https://localhost:52390
2. Look for the GitHub Copilot icon in the system tray (Windows) or menu bar (macOS)
3. Restart the Office application
4. Clear Office cache and try again

### SSL Certificate errors
1. Re-run the register script or installer
2. Or manually trust `certs/localhost.pem`

### Service not starting after install
- **Windows**: Check Task Scheduler for "CopilotOfficeAddin"
- **macOS**: Run `launchctl list | grep copilot` and check `/tmp/copilot-office-addin.log`
