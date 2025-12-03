$regPath = "HKCU:\Software\Microsoft\Office\16.0\WEF\Developer"

Write-Host "Removing all sideloaded add-ins..."

if (Test-Path $regPath) {
    Remove-Item -Path $regPath -Recurse -Force
    Write-Host "✓ All add-ins unregistered"
} else {
    Write-Host "No add-ins were registered"
}
