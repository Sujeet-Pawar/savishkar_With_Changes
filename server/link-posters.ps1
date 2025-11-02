Write-Host "Running Event Poster Linking Script..." -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot
node scripts\linkPostersWithLog.js

Write-Host ""
Write-Host "Check poster-link-log.txt for full details" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
