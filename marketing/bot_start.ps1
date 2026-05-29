# bot_start.ps1 - run with: powershell -File .\marketing\bot_start.ps1
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$botScript = Join-Path $scriptDir "telegram_bot.py"
$logFile   = Join-Path $scriptDir "output\bot.log"
$errLog    = Join-Path $scriptDir "output\bot_err.log"
$pidFile   = Join-Path $scriptDir "output\bot.pid"

New-Item -ItemType Directory -Force -Path (Join-Path $scriptDir "output") | Out-Null

if (Test-Path $pidFile) {
    $oldPid = Get-Content $pidFile -ErrorAction SilentlyContinue
    if ($oldPid) { Stop-Process -Id $oldPid -Force -ErrorAction SilentlyContinue }
    Remove-Item $pidFile -ErrorAction SilentlyContinue
}

Start-Sleep -Milliseconds 300

$proc = Start-Process pythonw `
    -ArgumentList $botScript `
    -WorkingDirectory $scriptDir `
    -RedirectStandardOutput $logFile `
    -RedirectStandardError  $errLog `
    -WindowStyle Hidden `
    -PassThru

$proc.Id | Out-File $pidFile -Encoding utf8
Write-Host "Bot started (PID $($proc.Id))" -ForegroundColor Green
Write-Host "Log: $logFile"
Write-Host "Stop: Stop-Process -Id $($proc.Id)"
