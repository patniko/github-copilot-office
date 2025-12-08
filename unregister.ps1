$regPath = "HKCU:\Software\Microsoft\Office\16.0\WEF\Developer"

Write-Host "Removing all sideloaded add-ins from Word, PowerPoint, and Excel..." -ForegroundColor Cyan

if (Test-Path $regPath) {
    Remove-Item -Path $regPath -Recurse -Force
    Write-Host "✓ All add-ins unregistered" -ForegroundColor Green
} else {
    Write-Host "No add-ins were registered" -ForegroundColor Gray
}

Write-Host ""
Write-Host "To re-register, run: .\register.ps1" -ForegroundColor Gray
