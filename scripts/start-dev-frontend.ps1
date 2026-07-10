$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location (Join-Path $root "frontend")
if (-not (Test-Path "node_modules")) { npm install }
Write-Host "[start-dev] Frontend http://localhost:5173" -ForegroundColor Cyan
npm run dev
