# Getting Started

Run the GitHub Copilot Office Add-in from this package.

## Prerequisites

| Software | Download |
|----------|----------|
| **Microsoft Office** | Word, PowerPoint, or Excel (Microsoft 365 or Office 2019+) |

## Setup

### 1. Register the Add-in (one time only)

This trusts the SSL certificate and registers the manifest with Office.

**macOS:**
```bash
./register.sh
```

**Windows (PowerShell as Administrator):**
```powershell
.\register.ps1
```

### 2. Launch the App

**macOS:** Double-click `GitHub Copilot Office Add-in.app`

**Windows:** Run `GitHub Copilot Office Add-in.exe`

You should see the GitHub Copilot icon appear in your system tray (Windows) or menu bar (macOS).

## Adding the Add-in in Office

1. Confirm you see the GitHub Copilot service running in your system tray/menu bar.

2. **Open** Word, PowerPoint, or Excel
   > **Close and reopen the app if it was already running before registration**

3. Go to **Insert** → **Add-ins** → **My Add-ins**

4. Look for the **GitHub Copilot** add-in. Write text or paste images to get started.

## Troubleshooting

### Add-in not showing up?
- Make sure the tray app is running (check for the icon in your system tray/menu bar)
- Completely quit and restart the Office application
- Re-run the register script

### SSL Certificate errors?
- Re-run `./register.sh` (macOS) or `.\register.ps1` (Windows)
- On macOS, you may need to enter your password to trust the certificate
