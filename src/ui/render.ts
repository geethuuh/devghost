import boxen from 'boxen';
import chalk from 'chalk';
import type { DiagnosisResult, ErrorContext } from '../types.js';

export function renderDiagnosis(diagnosis: DiagnosisResult, ctx: ErrorContext): string {
  const badge = chalk.bold.bgHex('#6366F1').white(' 👻 DevGhost ') +
    chalk.gray(` [${diagnosis.source.toUpperCase()}] `) +
    chalk.bold.red(`✖ Command Failed (Exit Code: ${ctx.exitCode})`);

  let content = `${badge}\n\n`;
  content += `${chalk.bold('Command:')}    ${chalk.yellow(ctx.command)}\n`;
  content += `${chalk.bold('Issue:')}      ${chalk.bold.white(diagnosis.title)}\n`;
  content += `${chalk.bold('Root Cause:')} ${chalk.italic.gray(diagnosis.rootCause)}\n`;

  if (diagnosis.fixCommand) {
    content += `\n${chalk.bold.green('✔ Suggested Fix:')}\n`;
    content += `  ${chalk.bold.cyan(diagnosis.fixCommand)}\n`;
    if (diagnosis.fixDescription) {
      content += `  ${chalk.dim(diagnosis.fixDescription)}\n`;
    }
  }

  content += `\n${chalk.dim('─'.repeat(45))}\n`;
  if (diagnosis.fixCommand) {
    content += `${chalk.bold.green('[Enter]')} Run Fix  ${chalk.bold.yellow('[e]')} Full Explanation  ${chalk.bold.gray('[q]')} Dismiss`;
  } else {
    content += `${chalk.bold.yellow('[e]')} Full Explanation  ${chalk.bold.gray('[q]')} Dismiss`;
  }

  return boxen(content, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'magenta',
  });
}

export function renderFullExplanation(diagnosis: DiagnosisResult, ctx: ErrorContext): void {
  console.log('\n' + chalk.bold.cyan('─── 🔍 Deep Dive Diagnosis ────────────────────────'));
  console.log(`${chalk.bold('Category:')}    ${diagnosis.category}`);
  console.log(`${chalk.bold('Confidence:')}  ${(diagnosis.confidence * 100).toFixed(0)}%`);
  console.log(`${chalk.bold('Context:')}     Directory: ${ctx.cwd}`);
  if (ctx.gitBranch) console.log(`${chalk.bold('Git Branch:')}  ${ctx.gitBranch}`);
  console.log(`\n${chalk.bold('Detailed Explanation:')}`);
  console.log(chalk.white(diagnosis.explanation));

  if (ctx.output) {
    console.log(`\n${chalk.bold('Captured Stderr (trimmed):')}`);
    console.log(chalk.dim(ctx.output.slice(0, 500)));
  }
  console.log(chalk.bold.cyan('───────────────────────────────────────────────────\n'));
}
