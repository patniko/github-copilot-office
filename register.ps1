$manifestPath = "$PSScriptRoot\manifest.xml"
$manifestFullPath = (Resolve-Path $manifestPath).Path

Write-Host "Adding manifest to registry for sideloading..."
Write-Host "Manifest path: $manifestFullPath"

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

Write-Host "✓ Add-in registered successfully!"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Close Word if it is open"
Write-Host "2. Start the dev server: npm run dev"
Write-Host "3. Open Word"
Write-Host "4. Look for Show Taskpane button on the Home ribbon"
Write-Host ""
Write-Host "To unregister, run: .\unregister.ps1"
