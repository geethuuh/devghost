import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';
import chalk from 'chalk';

export const POWERSHELL_HOOK_SNIPPET = `
# >>> DEVHOST SHELL HOOK >>>
if (-not (Test-Path Function:__devghost_orig_prompt)) {
    if (Test-Path Function:prompt) {
        Copy-Item Function:prompt Function:__devghost_orig_prompt
    } else {
        function Global:__devghost_orig_prompt { "PS $($executionContext.SessionState.Path.CurrentLocation)$('>' * ($nestedPromptLevel + 1)) " }
    }

    function Global:prompt {
        $lastExit = $LASTEXITCODE
        $lastOk = $?
        
        if (-not $lastOk -or ($lastExit -ne $null -and $lastExit -ne 0)) {
            $history = Get-History -Count 1 -ErrorAction SilentlyContinue
            if ($history) {
                $lastCmd = $history.CommandLine
                if ($lastCmd -and -not ($lastCmd -match '^(devghost|node\\s+.*devghost|npx\\s+devghost)')) {
                    $lastErr = if ($global:Error.Count -gt 0) { $global:Error[0].ToString() } else { "" }
                    $exitCode = if ($lastExit -ne $null -and $lastExit -ne 0) { $lastExit } else { 1 }
                    devghost diagnose --cmd "$lastCmd" --code "$exitCode" --err "$lastErr"
                }
            }
        }
        
        & __devghost_orig_prompt
    }
}
# <<< DEVHOST SHELL HOOK <<<
`;

export function getPowerShellProfilePath(): string | null {
  try {
    const profilePath = execSync('powershell.exe -NoProfile -Command "Write-Host $PROFILE"', {
      encoding: 'utf-8',
    }).trim();
    return profilePath || null;
  } catch {
    return null;
  }
}

export function installPowerShellHook(): boolean {
  const profilePath = getPowerShellProfilePath();
  if (!profilePath) {
    console.log(chalk.red('❌ Could not locate PowerShell $PROFILE.'));
    return false;
  }

  try {
    const dir = dirname(profilePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    let content = '';
    if (existsSync(profilePath)) {
      content = readFileSync(profilePath, 'utf-8');
    }

    if (content.includes('DEVHOST SHELL HOOK')) {
      console.log(chalk.yellow('⚡ DevGhost hook is already installed in your PowerShell profile:'));
      console.log(chalk.cyan(`   ${profilePath}`));
      return true;
    }

    writeFileSync(profilePath, `${content}\n${POWERSHELL_HOOK_SNIPPET}\n`, 'utf-8');
    console.log(chalk.bold.green('✔ Successfully installed DevGhost hook into PowerShell profile:'));
    console.log(chalk.cyan(`   ${profilePath}`));
    console.log(chalk.dim('\nRestart your PowerShell window or run: . $PROFILE\n'));
    return true;
  } catch (err: any) {
    console.log(chalk.red(`❌ Failed to write profile: ${err.message}`));
    return false;
  }
}
