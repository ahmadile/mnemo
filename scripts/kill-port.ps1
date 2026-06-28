$conns = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($conns) {
    $conns.OwningProcess | Sort-Object -Unique | ForEach-Object {
        Write-Host "Killing PID: $_"
        Stop-Process -Id $_ -Force
    }
} else {
    Write-Host "No process on port 3000"
}