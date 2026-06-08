# Push Player One IQ to GitHub
# Run after: gh auth login

$env:PATH = "C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;" + $env:PATH
Set-Location $PSScriptRoot

Write-Host "Checking GitHub login..." -ForegroundColor Cyan
gh auth status
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Not logged in. Run: gh auth login" -ForegroundColor Yellow
  Write-Host "Then run this script again." -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "Creating GitHub repo and pushing..." -ForegroundColor Cyan
gh repo create Player-One-IQ --public --source=. --remote=origin --push --description "Creator and sponsor management SaaS dashboard"

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "Done! View your repo:" -ForegroundColor Green
  gh repo view --web
}
