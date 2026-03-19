$appPath = "$PSScriptRoot\GitHub Copilot Office Add-in.exe"

# Check if running from release (exe exists) or dev (manifest in root)
if (Test-Path $appPath) {
    # Release mode: certs and manifest are in resources subfolder
    $manifestPath = "$PSScriptRoot\resources\manifest.xml"
    $certPath = "$PSScriptRoot\resources\certs\localhost.pem"
} else {
    # Dev mode: certs and manifest are in the repo root
    $manifestPath = "$PSScriptRoot\manifest.xml"
    $certPath = "$PSScriptRoot\certs\localhost.pem"
}

$manifestFullPath = (Resolve-Path $manifestPath).Path

Write-Host "Setting up Office Add-in for Windows..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Trust the SSL certificate
Write-Host "Step 1: Trusting development SSL certificate..." -ForegroundColor Yellow

if (!(Test-Path $certPath)) {
    Write-Host "Error: Certificate not found at $certPath" -ForegroundColor Red
    Write-Host "Certificates are required for HTTPS. Please ensure certs are in the repository." -ForegroundColor Red
    exit 1
}

$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($certPath)
$store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "CurrentUser")
$store.Open("ReadWrite")

# Check if certificate is already trusted
$existing = $store.Certificates | Where-Object { $_.Thumbprint -eq $cert.Thumbprint }
if ($existing) {
    Write-Host "  ✓ Certificate already trusted" -ForegroundColor Green
} else {
    $store.Add($cert)
    Write-Host "  ✓ Certificate trusted" -ForegroundColor Green
}

$store.Close()

Write-Host ""

# Step 2: Register manifest
Write-Host "Step 2: Registering add-in manifest..." -ForegroundColor Yellow
Write-Host "  Manifest: $manifestFullPath"

$regPath = "HKCU:\Software\Microsoft\Office\16.0\WEF\Developer"

if (!(Test-Path $regPath)) {
    New-Item -Path $regPath -Force | Out-Null
}

$existingManifests = Get-ItemProperty -Path $regPath -ErrorAction SilentlyContinue
$nextIndex = 0
while ($existingManifests.PSObject.Properties.Name -contains $nextIndex.ToString()) {
    $nextIndex++
}

New-ItemProperty -Path $regPath -Name $nextIndex.ToString() -Value $manifestFullPath -PropertyType String -Force | Out-Null

Write-Host "  ✓ Add-in registered" -ForegroundColor Green
Write-Host ""

Write-Host "Setup complete! Next steps:" -ForegroundColor Cyan
Write-Host "1. Close Word, PowerPoint, Excel, and OneNote if they are open"
Write-Host "2. Start the tray app: npm run start:tray"
Write-Host "3. Open Word, PowerPoint, Excel, or OneNote"
Write-Host "4. Go to Insert > Add-ins > My Add-ins and look for 'GitHub Copilot'"
Write-Host ""
Write-Host "To unregister, run: .\unregister.ps1" -ForegroundColor Gray

