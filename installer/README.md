# Building Installers

This directory contains resources for building standalone installers for Windows and macOS using Electron Builder.

## Prerequisites

1. **Node.js 20+** installed
2. **npm dependencies** installed: `npm install`

### macOS-specific
- Xcode Command Line Tools: `xcode-select --install`

## Building

### Build for Current Platform

```bash
npm run build:installer
```

### macOS Only

```bash
npm run build:installer:mac
```

**Output:** `build/electron/*.dmg`

### Windows Only

```bash
npm run build:installer:win
```

**Output:** `build/electron/*.exe`

## What the Installers Do

### Windows Installer (.exe)
1. Installs the Electron app to `C:\Program Files\GitHub Copilot Office Add-in\`
2. Bundles the built frontend, certificates, and manifest
3. Trusts the SSL certificate (adds to user's Root certificate store)
4. Registers the add-in manifest with Office (registry key)
5. Creates a startup entry to run on login
6. Starts the tray app immediately after install

### macOS Installer (.dmg)
1. Installs to `/Applications/GitHub Copilot Office Add-in.app/`
2. Bundles the built frontend, certificates, and manifest
3. Trusts the SSL certificate (adds to System keychain)
4. Registers the add-in with Word, PowerPoint, Excel, and OneNote (wef folders)
5. Installs a LaunchAgent to start on login
6. Starts the tray app immediately after install

## Uninstalling

### Windows
Use "Add or Remove Programs" in Windows Settings.

### macOS
```bash
sudo /Applications/GitHub\ Copilot\ Office\ Add-in.app/Contents/Resources/uninstall.sh
```

Or manually:
1. Stop the service: `launchctl unload ~/Library/LaunchAgents/com.github.copilot-office-addin.plist`
2. Delete the app: `sudo rm -rf "/Applications/GitHub Copilot Office Add-in.app"`
3. Remove LaunchAgent: `rm ~/Library/LaunchAgents/com.github.copilot-office-addin.plist`
4. Remove manifest from wef folders

## Code Signing (Optional)

For distribution outside your organization, you should sign the installers.

### Windows
Set the following environment variables before building:
- `CSC_LINK` - Path to your .pfx certificate file
- `CSC_KEY_PASSWORD` - Certificate password

Or use `signtool.exe` after building:
```powershell
signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com "build\electron\GitHub Copilot Office Add-in Setup.exe"
```

### macOS
Set the following environment variables before building:
- `CSC_NAME` - Your Developer ID certificate name (e.g., "Developer ID Application: Your Name (TEAMID)")

Or sign the DMG after building:
```bash
codesign --sign "Developer ID Application: Your Name (TEAMID)" "build/electron/GitHub Copilot Office Add-in.dmg"
```

## Troubleshooting

### Service not starting
- **Windows**: Check Task Scheduler for "CopilotOfficeAddin" task
- **macOS**: Check `launchctl list | grep copilot` and logs in `/tmp/copilot-office-addin.log`

### Add-in not appearing in Office
1. Ensure the service is running: visit https://localhost:52390 in browser
2. Restart the Office application
3. Check the manifest is registered:
   - **Windows**: `reg query "HKCU\Software\Microsoft\Office\16.0\WEF\Developer"`
   - **macOS**: Check `~/Library/Containers/com.microsoft.Word/Data/Documents/wef/`

### SSL Certificate issues
1. Visit https://localhost:52390 in your browser
2. If you see a certificate warning, the cert isn't trusted
3. Re-run the installer or manually trust the certificate
