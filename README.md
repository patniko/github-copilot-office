# Getting Started

Run the GitHub Copilot Office Add-in locally using the tray app—no installers required. Works in PowerPoint, Word and Excel.

## Setup

### 1. Download latest release for this repository and unzip contents

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
1. Confirm you see the GitHub Copilot service running in your macOS or Windows tray.
<img width="211" height="159" alt="image" src="https://github.com/user-attachments/assets/97bd61d2-6977-48e4-bf05-cd1529afa04d" />

2. **Open** Word, PowerPoint, or Excel
3. <img width="203" height="66" alt="image" src="https://github.com/user-attachments/assets/653e8c6f-7e93-447e-ac07-d0c8cf3834dd" />
> **Close and reopen the app if it was already running before registration**

4. Go to **Insert** → **Add-ins** → **My Add-ins**
<img width="459" height="324" alt="image" src="https://github.com/user-attachments/assets/fc157744-a0a0-4975-86d1-380736e2bb12" />

5. Look for the **GitHub Copilot** add-in. Write text or paste images to get started.
<img width="358" height="352" alt="image" src="https://github.com/user-attachments/assets/e06d89a5-5fa8-4940-92b6-e60b04c1e5c7" />

6. Have fun!

https://github.com/user-attachments/assets/5bb771d3-0bf6-4b7b-8e6c-757a085b3131

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
