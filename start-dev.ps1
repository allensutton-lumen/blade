#!/usr/bin/env pwsh
param([int]$PortDrainAttempts = 6,[switch]$Restart)
$root = $PSScriptRoot
Write-Host ">> Checking AWS SSO session (profile: AWSAdmin-396304931560)..." -ForegroundColor Cyan
$stsCheck = aws sts get-caller-identity --profile AWSAdmin-396304931560 2>&1
if ($LASTEXITCODE -ne 0) { aws sso login --profile AWSAdmin-396304931560 }
$childShell = if (Test-Path (Join-Path $env:WINDIR "System32\WindowsPowerShell1.0\powershell.exe")) { Join-Path $env:WINDIR "System32\WindowsPowerShell1.0\powershell.exe" } else { "powershell" }
$freePortsScript = Join-Path $root "scripts\FreeLocalDevPorts.ps1"
if ($Restart -and (Test-Path $freePortsScript)) { & $freePortsScript -Ports @(3001, 5173) -MaxAttemptsPerPort $PortDrainAttempts } elseif (Test-Path $freePortsScript) { & $freePortsScript -Ports @(5173) -MaxAttemptsPerPort $PortDrainAttempts }
$backendScript = Join-Path $root "scripts\start-dev-backend.ps1"
$frontendScript = Join-Path $root "scripts\start-dev-frontend.ps1"
if (-not $Restart) {
  try { $null = Invoke-WebRequest -Uri "http://127.0.0.1:3001/api/health" -UseBasicParsing -TimeoutSec 2; Write-Host "[start-dev] Backend already healthy on :3001 - reusing it." -ForegroundColor Yellow }
  catch { Start-Process -FilePath $childShell -ArgumentList @('-NoExit','-NoProfile','-ExecutionPolicy','Bypass','-File',$backendScript) }
} else { Start-Process -FilePath $childShell -ArgumentList @('-NoExit','-NoProfile','-ExecutionPolicy','Bypass','-File',$backendScript) }
Start-Sleep -Seconds 3
Start-Process -FilePath $childShell -ArgumentList @('-NoExit','-NoProfile','-ExecutionPolicy','Bypass','-File',$frontendScript)
Write-Host "Backend -> http://localhost:3001/api/health"
Write-Host "Frontend -> http://localhost:5173"
