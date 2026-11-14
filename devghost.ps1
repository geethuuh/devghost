<#
.SYNOPSIS
    DevGhost - Terminal Companion Runner for Windows PowerShell
#>
param(
    [Parameter(Position=0)]
    [string]$Action,

    [string]$cmd = "",
    [int]$code = 0,
    [string]$err = ""
)

function Show-DevGhostCard {
    param(
        [string]$CommandText,
        [int]$ExitCode,
        [string]$Issue,
        [string]$RootCause,
        [string]$FixCmd,
        [string]$FixDesc
    )

    Write-Host ""
    Write-Host "+------------------------------------------------------------------------------+" -ForegroundColor Magenta
    Write-Host "| " -NoNewline -ForegroundColor Magenta
    Write-Host " 👻 DevGhost (Native Runner) " -NoNewline -BackgroundColor Magenta -ForegroundColor White
    Write-Host "  Command Failed (Exit Code: $ExitCode)" -ForegroundColor Red
    Write-Host "| " -ForegroundColor Magenta
    Write-Host "| " -NoNewline -ForegroundColor Magenta
    Write-Host "Command:    " -NoNewline -ForegroundColor White
    Write-Host "$CommandText" -ForegroundColor Yellow
    Write-Host "| " -NoNewline -ForegroundColor Magenta
    Write-Host "Issue:      " -NoNewline -ForegroundColor White
    Write-Host "$Issue" -ForegroundColor White
    Write-Host "| " -NoNewline -ForegroundColor Magenta
    Write-Host "Root Cause: " -NoNewline -ForegroundColor White
    Write-Host "$RootCause" -ForegroundColor DarkGray

    if ($FixCmd) {
        Write-Host "| " -ForegroundColor Magenta
        Write-Host "| " -NoNewline -ForegroundColor Magenta
        Write-Host "✔ Suggested Fix:" -ForegroundColor Green
        Write-Host "| " -NoNewline -ForegroundColor Magenta
        Write-Host "  $FixCmd" -ForegroundColor Cyan
        if ($FixDesc) {
            Write-Host "| " -NoNewline -ForegroundColor Magenta
            Write-Host "  $FixDesc" -ForegroundColor DarkGray
        }
    }

    Write-Host "| ----------------------------------------------------------------------------" -ForegroundColor Magenta
    Write-Host "| " -NoNewline -ForegroundColor Magenta
    if ($FixCmd) {
        Write-Host "[Enter] " -NoNewline -ForegroundColor Green
        Write-Host "Run Fix   " -NoNewline -ForegroundColor White
        Write-Host "[e] " -NoNewline -ForegroundColor Yellow
        Write-Host "Explanation   " -NoNewline -ForegroundColor White
        Write-Host "[q] " -NoNewline -ForegroundColor DarkGray
        Write-Host "Dismiss" -ForegroundColor White
    } else {
        Write-Host "[e] " -NoNewline -ForegroundColor Yellow
        Write-Host "Explanation   " -NoNewline -ForegroundColor White
        Write-Host "[q] " -NoNewline -ForegroundColor DarkGray
        Write-Host "Dismiss" -ForegroundColor White
    }
    Write-Host "+------------------------------------------------------------------------------+" -ForegroundColor Magenta
    Write-Host ""

    # Interactive keypress if running in interactive console
    if ([Environment]::UserInteractive -and -not [Console]::IsInputRedirected) {
        while ($true) {
            $key = [Console]::ReadKey($true)
            if ($key.Key -eq [ConsoleKey]::Enter) {
                if ($FixCmd) {
                    Write-Host "`n⚡ Executing fix: $FixCmd`n" -ForegroundColor Green
                    Invoke-Expression $FixCmd
                    Write-Host "`n✔ Fix executed!`n" -ForegroundColor Green
                }
                break
            } elseif ($key.Key -eq [ConsoleKey]::E) {
                Write-Host "`n--- 🔍 Deep Dive Diagnosis -----------------------------------" -ForegroundColor Cyan
                Write-Host "Root Cause Analysis: $RootCause"
                Write-Host "Proposed Resolution: $FixDesc"
                Write-Host "------------------------------------------------------------`n" -ForegroundColor Cyan
                Write-Host "[Enter] Run Fix   [q] Dismiss: " -NoNewline -ForegroundColor DarkGray
            } elseif ($key.Key -eq [ConsoleKey]::Q -or $key.Key -eq [ConsoleKey]::Escape) {
                Write-Host "Dismissed DevGhost.`n" -ForegroundColor DarkGray
                break
            }
        }
    } else {
        if ($FixCmd) {
            Write-Host "DevGhost fix available: $FixCmd`n" -ForegroundColor Green
        }
    }
}

# --- Actions ---
if ($Action -eq "demo" -or ($args -contains "demo")) {
    Write-Host "`n--- 👻 Running DevGhost PowerShell Demo -----------------------" -ForegroundColor Cyan
    Write-Host "Simulating real crash: 'npm run dev' failing on port 3000...`n" -ForegroundColor DarkGray
    Show-DevGhostCard -CommandText "npm run dev" -ExitCode 1 `
        -Issue "Port 3000 Conflict (EADDRINUSE)" `
        -RootCause "Another background process is actively bound to local port 3000." `
        -FixCmd "npx kill-port 3000" `
        -FixDesc "Terminate the orphan process occupying port 3000."
    exit
}

if ($Action -eq "status" -or ($args -contains "status")) {
    Write-Host "`n👻 DevGhost Status (Systems Engine)`n" -ForegroundColor Magenta
    Write-Host "Codebase:      Native C (GitHub: geethuuh/devghost)" -ForegroundColor White
    Write-Host "Runner:        PowerShell Native CLI" -ForegroundColor White
    Write-Host "Platform:      Windows Win32" -ForegroundColor White
    Write-Host "`nRun " -NoNewline
    Write-Host "devghost demo" -NoNewline -ForegroundColor Cyan
    Write-Host " to test interactive crash interception!`n"
    exit
}

# General diagnose
if ($cmd) {
    $matched = $false
    $combined = "$cmd $err"

    if ($combined -match "EADDRINUSE|address already in use") {
        $port = "3000"
        if ($combined -match ":::(\d+)|:(\d+)") { $port = $Matches[1] }
        Show-DevGhostCard -CommandText $cmd -ExitCode $code `
            -Issue "Port $port Conflict (EADDRINUSE)" `
            -RootCause "Another process is bound to port $port." `
            -FixCmd "npx kill-port $port" `
            -FixDesc "Free up port $port."
        $matched = $true
    } elseif ($combined -match "Cannot find module ['`"]([^'`"]+)['`"]") {
        $pkg = $Matches[1]
        Show-DevGhostCard -CommandText $cmd -ExitCode $code `
            -Issue "Missing Dependency: '$pkg'" `
            -RootCause "Package '$pkg' is imported but not installed." `
            -FixCmd "npm install $pkg" `
            -FixDesc "Install '$pkg' via npm."
        $matched = $true
    }

    if (-not $matched) {
        Show-DevGhostCard -CommandText $cmd -ExitCode $code `
            -Issue "Command Failed with Exit Code $code" `
            -RootCause "Process exited unexpectedly." `
            -FixCmd "" -FixDesc ""
    }
    exit
}

Write-Host "`n👻 DevGhost - Autonomous Shell Interceptor" -ForegroundColor Magenta
Write-Host "Usage:"
Write-Host "  devghost demo                   Run simulated crash diagnosis"
Write-Host "  devghost status                 Show runtime status"
Write-Host "  devghost -cmd <cmd> -code <code> -err <err>  Diagnose crash`n"
