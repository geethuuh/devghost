# DevGhost PowerShell Shell Hook
function Global:prompt {
    $lastExit = $LASTEXITCODE
    if ($lastExit -ne $null -and $lastExit -ne 0) {
        $h = Get-History -Count 1 -ErrorAction SilentlyContinue
        if ($h -and -not ($h.CommandLine -match '^devghost')) {
            devghost --cmd "$($h.CommandLine)" --code "$lastExit"
        }
    }
    "PS $($executionContext.SessionState.Path.CurrentLocation)> "
}
