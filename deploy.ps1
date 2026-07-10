<#
.SYNOPSIS
    Deploy BLADE infrastructure and application.
#>
param(
    [Parameter(Mandatory=$true)] [ValidateSet('dev', 'prod')] [string]$Environment,
    [switch]$SkipBuild,
    [switch]$SkipPlan,
    [switch]$CIMode
)
$ErrorActionPreference = "Stop"
function Write-Step { param($Message) Write-Host "`n===> $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-ErrorMessage { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-WarningMessage { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Test-AWSCredentials {
    param([string]$SsoProfile,[string]$ExpectedAccountId)
    try {
        $identity = aws sts get-caller-identity --profile $SsoProfile 2>&1 | ConvertFrom-Json
        if ($identity.Account -eq $ExpectedAccountId) { Write-Success "AWS credentials valid: $($identity.Arn)"; return $true }
    } catch { Write-WarningMessage "AWS credentials expired or invalid" }
    aws sso logout 2>&1 | Out-Null
    aws sso login --profile $SsoProfile
    $identity = aws sts get-caller-identity --profile $SsoProfile | ConvertFrom-Json
    return ($identity.Account -eq $ExpectedAccountId)
}
node --version | Out-Null; aws --version | Out-Null; terraform version -json | Out-Null
$awsAccountId = if ($Environment -eq 'prod') { '111491017663' } else { '396304931560' }
$ssoProfile = "AWSAdmin-$awsAccountId"
if (-not $CIMode -and -not (Test-AWSCredentials -SsoProfile $ssoProfile -ExpectedAccountId $awsAccountId)) { exit 1 }
if (-not $SkipBuild) {
    Push-Location (Join-Path $PSScriptRoot 'frontend'); npm ci; npm run build; Pop-Location
    Push-Location (Join-Path $PSScriptRoot 'backend'); npm ci; npm run build
    $distDir = Join-Path $PWD 'dist'
    $publicDir = Join-Path $distDir 'public'
    if (Test-Path $publicDir) { Remove-Item $publicDir -Recurse -Force }
    Copy-Item -Path (Join-Path (Join-Path $PSScriptRoot 'frontend') 'dist') -Destination $publicDir -Recurse
    $zipPath = Join-Path $PWD 'blade-backend.zip'
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    Compress-Archive -Path @('dist', 'node_modules', 'package.json', 'package-lock.json') -DestinationPath $zipPath -Force
    Pop-Location
}
$terraformDir = Join-Path $PSScriptRoot 'terraform'
Push-Location $terraformDir
try {
    $backendConfig = if ($Environment -eq 'prod') { 'backend-prod.tfbackend' } else { 'backend-dev.tfbackend' }
    $tfvarsFile = if ($Environment -eq 'prod') { 'terraform.tfvars.prod' } else { 'terraform.tfvars.dev' }
    if (-not $CIMode) {
        $cliCacheDir = Join-Path $env:USERPROFILE ".aws\cli\cache"
        $stsCreds = $null
        if (Test-Path $cliCacheDir) {
            $stsCreds = Get-ChildItem $cliCacheDir -Filter "*.json" | Sort-Object LastWriteTime -Descending | ForEach-Object {
                try {
                    $c = Get-Content $_.FullName -Raw | ConvertFrom-Json
                    if ($c.Credentials -and $c.Credentials.AccessKeyId) {
                        $exp = [DateTime]::Parse($c.Credentials.Expiration).ToUniversalTime()
                        if ($exp -gt [DateTime]::UtcNow.AddMinutes(2)) { $c.Credentials }
                    }
                } catch {}
            } | Select-Object -First 1
        }
        if ($stsCreds) {
            $env:AWS_ACCESS_KEY_ID     = $stsCreds.AccessKeyId
            $env:AWS_SECRET_ACCESS_KEY = $stsCreds.SecretAccessKey
            $env:AWS_SESSION_TOKEN     = $stsCreds.SessionToken
            $env:AWS_PROFILE           = ""
        } else { Write-ErrorMessage "Could not read valid AWS credentials from CLI cache. Run: aws sso login --profile $ssoProfile"; exit 1 }
    }
    terraform init -reconfigure -backend-config="$backendConfig"
    if (-not $SkipPlan) { terraform plan -var-file="$tfvarsFile" -out=tfplan; $confirm = Read-Host "Apply changes? (yes/no)"; if ($confirm -ne 'yes') { exit 0 }; terraform apply tfplan } else { terraform apply -var-file="$tfvarsFile" -auto-approve }
    terraform output
} finally { Pop-Location }
