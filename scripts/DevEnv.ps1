param(
    [Parameter(Mandatory = $false)]
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

Remove-Item Env:\AWS_ACCESS_KEY_ID -ErrorAction SilentlyContinue
Remove-Item Env:\AWS_SECRET_ACCESS_KEY -ErrorAction SilentlyContinue
Remove-Item Env:\AWS_SESSION_TOKEN -ErrorAction SilentlyContinue

$envFile = Join-Path $RepoRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*)\s*$') {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim())
        }
    }
    Write-Host "[ok] Loaded .env" -ForegroundColor Green
} else {
    Write-Warning ".env not found at $envFile - copy .env.example and fill in values"
}

Write-Host ">> Resolving AWS credentials via CLI..." -ForegroundColor Cyan
$awsProfile = $env:DEV_AWS_PROFILE
if ($awsProfile) {
    aws sts get-caller-identity --profile $awsProfile 2>$null | Out-Null
    $cliCacheDir = Join-Path $env:USERPROFILE ".aws\cli\cache"
    $stsCreds = $null
    if (Test-Path $cliCacheDir) {
        $stsCreds = Get-ChildItem $cliCacheDir -Filter "*.json" |
            Sort-Object LastWriteTime -Descending |
            ForEach-Object {
                try {
                    $c = Get-Content $_.FullName -Raw | ConvertFrom-Json
                    if ($c.Credentials -and $c.Credentials.AccessKeyId) {
                        $exp = [DateTime]::Parse($c.Credentials.Expiration).ToUniversalTime()
                        if ($exp -gt [DateTime]::UtcNow.AddMinutes(2)) { $c.Credentials }
                    }
                } catch {}
            } |
            Select-Object -First 1
    }
    if ($stsCreds) {
        $env:AWS_ACCESS_KEY_ID     = $stsCreds.AccessKeyId
        $env:AWS_SECRET_ACCESS_KEY = $stsCreds.SecretAccessKey
        $env:AWS_SESSION_TOKEN     = $stsCreds.SessionToken
        $env:AWS_PROFILE           = ""
        Write-Host "  [ok] AWS credentials loaded from CLI cache (expire $($stsCreds.Expiration))" -ForegroundColor Green
    } else {
        Write-Warning "Could not obtain temporary AWS credentials for profile '$awsProfile'."
        Write-Warning "Run: aws sso login --profile $awsProfile"
    }
}
