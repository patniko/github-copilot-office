# Build script for Windows installer
# Run from repository root in PowerShell

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$BuildDir = Join-Path $RootDir "build\windows"
$Version = "1.0.0"

Write-Host "Building Windows installer..." -ForegroundColor Cyan

# Clean and create build directory
if (Test-Path $BuildDir) {
    Remove-Item -Recurse -Force $BuildDir
}
New-Item -ItemType Directory -Force -Path $BuildDir | Out-Null

# Build the frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
Push-Location $RootDir
npm run build
Pop-Location

# Build the server executable with pkg
Write-Host "Building server executable..." -ForegroundColor Yellow
Push-Location $RootDir
npm exec -- pkg src/server-prod.js `
    --targets node18-win-x64 `
    --output "$BuildDir\copilot-office-server.exe" `
    --compress GZip
Pop-Location

Write-Host ""
Write-Host "✓ Windows executable built successfully!" -ForegroundColor Green
Write-Host "  Output: $BuildDir\copilot-office-server.exe"
Write-Host ""

# Look for Inno Setup
$InnoSetupPath = $null
$PossiblePaths = @(
    "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
    "${env:ProgramFiles}\Inno Setup 6\ISCC.exe",
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    "C:\Program Files\Inno Setup 6\ISCC.exe"
)

foreach ($Path in $PossiblePaths) {
    if (Test-Path $Path) {
        $InnoSetupPath = $Path
        break
    }
}

if ($InnoSetupPath) {
    Write-Host "Building installer with Inno Setup..." -ForegroundColor Yellow
    & $InnoSetupPath "$ScriptDir\installer.iss"
    
    Write-Host ""
    Write-Host "✓ Windows installer built successfully!" -ForegroundColor Green
    Write-Host "  Output: $BuildDir\CopilotOfficeAddin-Setup-$Version.exe"
} else {
    Write-Host ""
    Write-Host "Note: Inno Setup not found. Executable built but installer not created." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To create the installer:"
    Write-Host "1. Install Inno Setup 6 from https://jrsoftware.org/isinfo.php"
    Write-Host "2. Run: iscc installer\windows\installer.iss"
}
