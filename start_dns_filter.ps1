# ============================================================
# DNS Filtering System - Startup Script
# Run as Administrator (required for port 53 + DNS change)
# ============================================================

param(
    [switch]$Stop  # Pass -Stop to restore original DNS and kill server
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$venvPython = Join-Path $scriptDir "venv\Scripts\python.exe"
$BackupFile = Join-Path $scriptDir "dns_backup.txt"

# Check Admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator." -ForegroundColor Red
    Write-Host "Right-click PowerShell -> 'Run as administrator', then re-run this script." -ForegroundColor Yellow
    exit 1
}

# ---- STOP MODE ----
if ($Stop) {
    Write-Host "Stopping DNS Filtering System..." -ForegroundColor Yellow

    # Kill the Python server
    Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*dns_filter*" } | Stop-Process -Force
    Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

    # Restore DNS
    if (Test-Path $BackupFile) {
        $backup = Get-Content $BackupFile | ConvertFrom-Json
        foreach ($entry in $backup) {
            Set-DnsClientServerAddress -InterfaceIndex $entry.Index -ServerAddresses $entry.Servers
            Write-Host "Restored DNS on: $($entry.Alias)" -ForegroundColor Green
        }
        Remove-Item $BackupFile
    } else {
        # Fallback: reset to DHCP
        $adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
        foreach ($adapter in $adapters) {
            Set-DnsClientServerAddress -InterfaceIndex $adapter.InterfaceIndex -ResetServerAddress
        }
        Write-Host "DNS reset to DHCP (automatic)." -ForegroundColor Green
    }

    Write-Host "DNS Filtering System stopped. DNS restored." -ForegroundColor Green
    exit 0
}

# ---- START MODE ----
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "     DNS FILTERING SYSTEM - STARTUP" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Backup current DNS settings
Write-Host "[1/4] Backing up current DNS settings..." -ForegroundColor Yellow
$adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" -and $_.InterfaceDescription -notlike "*Loopback*" }
$backupData = @()
foreach ($adapter in $adapters) {
    $dns = (Get-DnsClientServerAddress -InterfaceIndex $adapter.InterfaceIndex -AddressFamily IPv4).ServerAddresses
    $backupData += @{ Index = $adapter.InterfaceIndex; Alias = $adapter.Name; Servers = $dns }
    Write-Host "  Saved DNS for '$($adapter.Name)': $($dns -join ', ')" -ForegroundColor Gray
}
$backupData | ConvertTo-Json | Set-Content $BackupFile
Write-Host "  DNS backup saved to: $BackupFile" -ForegroundColor Gray

# 2. Point system DNS to our filter (127.0.0.1)
Write-Host "[2/4] Redirecting system DNS to 127.0.0.1..." -ForegroundColor Yellow
foreach ($adapter in $adapters) {
    Set-DnsClientServerAddress -InterfaceIndex $adapter.InterfaceIndex -ServerAddresses "127.0.0.1"
    Write-Host "  DNS set on '$($adapter.Name)' -> 127.0.0.1" -ForegroundColor Green
}

# Flush existing DNS cache
Write-Host "  Flushing Windows DNS cache..." -ForegroundColor Gray
Clear-DnsClientCache
ipconfig /flushdns | Out-Null

# 3. Check if port 53 is free
Write-Host "[3/4] Checking port 53 availability..." -ForegroundColor Yellow
$port53 = Get-NetTCPConnection -LocalPort 53 -ErrorAction SilentlyContinue
$port53udp = netstat -an | Select-String ":53 " | Select-String "LISTENING"
if ($port53) {
    Write-Host "  WARNING: Port 53 TCP is in use. Checking if it's our server..." -ForegroundColor Yellow
}

# Disable Windows DNS Client service (it occupies port 53 on some systems)
$dnsClientSvc = Get-Service -Name "Dnscache" -ErrorAction SilentlyContinue
if ($dnsClientSvc -and $dnsClientSvc.Status -eq "Running") {
    Write-Host "  Stopping Windows DNS Client cache service (Dnscache)..." -ForegroundColor Yellow
    try {
        Stop-Service -Name "Dnscache" -Force -ErrorAction SilentlyContinue
        Set-Service -Name "Dnscache" -StartupType Disabled -ErrorAction SilentlyContinue
        Write-Host "  Windows DNS Client stopped." -ForegroundColor Green
    } catch {
        Write-Host "  Could not stop Dnscache (may not be needed). Continuing..." -ForegroundColor Gray
    }
}

# 4. Start the DNS Filtering server
Write-Host "[4/4] Starting DNS Filtering Server..." -ForegroundColor Yellow
Write-Host ""

Set-Location $scriptDir

# Start the server in a new window so output is visible
$serverArgs = "-m dns_filter.server"
$process = Start-Process -FilePath $venvPython `
    -ArgumentList $serverArgs `
    -WorkingDirectory $scriptDir `
    -PassThru `
    -WindowStyle Normal

Start-Sleep -Seconds 3

if ($process.HasExited) {
    Write-Host "ERROR: DNS server failed to start (exit code: $($process.ExitCode))." -ForegroundColor Red
    Write-Host "Restoring DNS..." -ForegroundColor Yellow
    # Restore DNS on failure
    foreach ($entry in $backupData) {
        Set-DnsClientServerAddress -InterfaceIndex $entry.Index -ServerAddresses $entry.Servers
    }
    exit 1
}

Write-Host "============================================" -ForegroundColor Green
Write-Host "     DNS FILTERING SYSTEM ACTIVE" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  DNS Filter   : 127.0.0.1:53" -ForegroundColor Cyan
Write-Host "  Web API      : http://127.0.0.1:5000" -ForegroundColor Cyan
Write-Host "  Web UI       : http://localhost:5173 (run 'npm run dev' in Frontend/)" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Test blocking:" -ForegroundColor Yellow
Write-Host "    nslookup paypal-secure-login.com 127.0.0.1" -ForegroundColor Gray
Write-Host "    nslookup malware-c2-server.ru 127.0.0.1" -ForegroundColor Gray
Write-Host "    nslookup google.com 127.0.0.1  (should ALLOW)" -ForegroundColor Gray
Write-Host ""
Write-Host "  To STOP and restore DNS:" -ForegroundColor Yellow
Write-Host "    .\start_dns_filter.ps1 -Stop" -ForegroundColor Gray
Write-Host ""
Write-Host "  PID: $($process.Id)" -ForegroundColor Gray
