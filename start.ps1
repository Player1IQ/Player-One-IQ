# Player One IQ — start the app (fixes Node not being on PATH in some terminals)
$nodeDir = "C:\Program Files\nodejs"
if (Test-Path $nodeDir) {
  $env:PATH = "$nodeDir;$env:PATH"
}

Set-Location $PSScriptRoot

if (-not (Test-Path "node_modules")) {
  Write-Host "Installing dependencies..." -ForegroundColor Yellow
  npm install
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

# Free port 3000 if a previous server is still running
$portUsers = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($portUsers) {
  Write-Host "Stopping existing server on port 3000..." -ForegroundColor Yellow
  $portUsers | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Seconds 2
}

# Clear stale .next cache (OneDrive can corrupt build files)
if (Test-Path ".next") {
  Write-Host "Clearing build cache..." -ForegroundColor Yellow
  Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Starting Player One IQ..." -ForegroundColor Cyan
Write-Host "Open: http://127.0.0.1:3000" -ForegroundColor Green
Write-Host "Keep this window open while using the app." -ForegroundColor Gray
Write-Host ""

npm run dev
