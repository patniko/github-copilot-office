# Getting Started (Local Development)

Run the GitHub Copilot Office Add-in locally using the tray app—no installers required.

## Prerequisites

Install the following software:

| Software | Download |
|----------|----------|
| **Node.js 20+** | [nodejs.org](https://nodejs.org/) |
| **Git** | [git-scm.com](https://git-scm.com/downloads) |
| **Microsoft Office** | Word, PowerPoint, or Excel (Microsoft 365 or Office 2019+) |

## Setup

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/githubnext/copilot-office-addin.git
cd copilot-office-addin
npm install
```

### 2. Register the Add-in

This trusts the SSL certificate and registers the manifest with Office.

**macOS:**
```bash
./register.sh
```

**Windows (PowerShell as Administrator):**
```powershell
.\register.ps1
```

### 3. Start the Tray Application

```bash
npm run start:tray
```

You should see the GitHub Copilot icon appear in your system tray (Windows) or menu bar (macOS).

## Adding the Add-in in Office

1. **Open** Word, PowerPoint, or Excel
2. **Close and reopen** the app if it was already running before registration
3. Look for the **GitHub Copilot** button on the **Home** ribbon

### If the button doesn't appear automatically

1. Go to **Insert** → **Add-ins** → **My Add-ins**
2. Look under **Developer Add-ins** or **Shared Folder**
3. Select **GitHub Copilot** and click **Add**

## Troubleshooting

### Add-in not showing up?
- Make sure the tray app is running (check for the icon in your system tray/menu bar)
- Completely quit and restart the Office application
- Re-run the register script

### SSL Certificate errors?
- Re-run `./register.sh` (macOS) or `.\register.ps1` (Windows)
- On macOS, you may need to enter your password to trust the certificate

### Want to use the dev server with hot reload instead?
```bash
npm run dev
```
This starts the development server on port 52390 with hot reload.

## Uninstalling

```bash
./unregister.sh      # macOS
.\unregister.ps1     # Windows
```
