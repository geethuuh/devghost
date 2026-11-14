import { spawn } from 'node:child_process';
import chalk from 'chalk';
import readline from 'node:readline';
import type { DiagnosisResult, ErrorContext } from '../types.js';
import { renderFullExplanation } from '../ui/render.js';

export async function promptAndExecute(diagnosis: DiagnosisResult, ctx: ErrorContext): Promise<void> {
  if (!process.stdin.isTTY) {
    // Non-interactive environment, print suggestion and exit
    if (diagnosis.fixCommand) {
      console.log(`\n${chalk.green('DevGhost fix available:')} ${diagnosis.fixCommand}\n`);
    }
    return;
  }

  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();

  return new Promise((resolve) => {
    const cleanup = () => {
      try {
        process.stdin.setRawMode(false);
        process.stdin.pause();
      } catch {}
    };

    const onKeypress = (_str: string, key: readline.Key) => {
      if (key.ctrl && key.name === 'c') {
        cleanup();
        process.stdin.removeListener('keypress', onKeypress);
        process.exit(0);
      }

      if (key.name === 'return' || key.name === 'enter') {
        cleanup();
        process.stdin.removeListener('keypress', onKeypress);

        if (!diagnosis.fixCommand) {
          resolve();
          return;
        }

        console.log(`\n${chalk.bold.green('⚡ Executing fix:')} ${chalk.cyan(diagnosis.fixCommand)}\n`);
        const child = spawn(diagnosis.fixCommand, {
          shell: true,
          stdio: 'inherit',
          cwd: ctx.cwd,
        });

        child.on('close', (code) => {
          if (code === 0) {
            console.log(`\n${chalk.bold.green('✔ Fix completed successfully!')}\n`);
          } else {
            console.log(`\n${chalk.bold.red(`✖ Fix command exited with code ${code}`)}\n`);
          }
          resolve();
        });
        return;
      }

      if (key.name === 'e') {
        renderFullExplanation(diagnosis, ctx);
        console.log(`${chalk.bold.green('[Enter]')} Run Fix  ${chalk.bold.gray('[q]')} Dismiss`);
        return;
      }

      if (key.name === 'q' || key.name === 'escape') {
        cleanup();
        process.stdin.removeListener('keypress', onKeypress);
        console.log(chalk.gray('Dismissed DevGhost.\n'));
        resolve();
      }
    };

    process.stdin.on('keypress', onKeypress);
  });
}
