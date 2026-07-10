param(
    [int[]]$Ports = @(3001, 5173),
    [int]$MaxAttemptsPerPort = 10,
    [switch]$Strict
)

foreach ($port in $Ports) {
    $attempt = 0
    while ($attempt -lt $MaxAttemptsPerPort) {
        $attempt++
        $connections = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
        if ($connections.Count -eq 0) { break }
        $pids = @(
            $connections |
                Select-Object -ExpandProperty OwningProcess -Unique |
                Where-Object { $_ -and $_ -ne $PID }
        )
        foreach ($procId in $pids) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            Write-Host "  Freed :$port (PID $procId)" -ForegroundColor DarkGray
        }
        Start-Sleep -Seconds 1
    }
    if (@(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue).Count -gt 0) {
        $message = "Port $port still has a LISTEN socket after $MaxAttemptsPerPort attempts."
        if ($Strict) { Write-Error $message; exit 1 }
        Write-Warning $message
    }
}
