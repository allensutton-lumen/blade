$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
. (Join-Path $root "scripts\DevEnv.ps1") -RepoRoot $root
Set-Location (Join-Path $root "backend")
if (-not (Test-Path "node_modules")) { npm install }
Write-Host "[start-dev] Backend http://localhost:3001" -ForegroundColor Cyan
npm run dev
