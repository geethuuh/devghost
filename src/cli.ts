#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { harvestContext } from './harvester/context.js';
import { runHeuristicRules } from './engine/heuristics.js';
import { runAIDiagnosis } from './engine/ai.js';
import { renderDiagnosis } from './ui/render.js';
import { promptAndExecute } from './executor/runner.js';
import { installPowerShellHook, getPowerShellProfilePath } from './hooks/powershell.js';
import type { DiagnosisResult } from './types.js';

const program = new Command();

program
  .name('devghost')
  .description('Autonomous Shell Interceptor & Self-Healing Terminal Companion')
  .version('1.0.0');

// Subcommand: diagnose
program
  .command('diagnose')
  .description('Diagnose a failed command and propose an automated fix')
  .requiredOption('--cmd <command>', 'The command that failed')
  .requiredOption('--code <number>', 'The exit code', (val) => parseInt(val, 10))
  .option('--err <errorText>', 'The captured error output or message', '')
  .action(async (options) => {
    const { cmd, code, err } = options;
    if (code === 0) return; // Command was successful, nothing to diagnose

    const context = harvestContext(cmd, code, err);

    // 1. Try instant heuristic rules (<1ms)
    let diagnosis: DiagnosisResult | null = runHeuristicRules(context);

    // 2. If no heuristic rule matched, try AI diagnosis
    if (!diagnosis) {
      diagnosis = await runAIDiagnosis(context);
    }

    // 3. Fallback generic diagnosis if still unhandled
    if (!diagnosis) {
      diagnosis = {
        category: 'general_runtime',
        title: 'Command Failed with Non-Zero Exit Code',
        rootCause: `Command '${cmd}' exited with code ${code}.`,
        explanation: 'The command terminated with an error. Check the terminal logs above for specific stack trace details.',
        confidence: 0.5,
        source: 'heuristic',
      };
    }

    // 4. Render interactive TUI card
    console.log(renderDiagnosis(diagnosis, context));

    // 5. Prompt user to run fix or view deep-dive
    await promptAndExecute(diagnosis, context);
  });

// Subcommand: setup
program
  .command('setup')
  .description('Install the DevGhost hook into your PowerShell profile')
  .action(() => {
    console.log(chalk.bold.magenta('\n👻 Setting up DevGhost Shell Hook...\n'));
    installPowerShellHook();
  });

// Subcommand: status
program
  .command('status')
  .description('Check DevGhost installation, shell hook status, and environment')
  .action(() => {
    console.log(chalk.bold.magenta('\n👻 DevGhost Status Check\n'));
    console.log(`${chalk.bold('Node Version:')}    ${process.version}`);
    console.log(`${chalk.bold('Platform:')}        ${process.platform} (${process.arch})`);
    
    const profile = getPowerShellProfilePath();
    console.log(`${chalk.bold('PowerShell Profile:')} ${profile || 'Not found'}`);

    const hasAIKey = !!(process.env.GEMINI_API_KEY || process.env.DEVGHOST_API_KEY);
    console.log(`${chalk.bold('AI Engine:')}        ${hasAIKey ? chalk.green('Enabled (API key detected)') : chalk.yellow('Offline Heuristics (Set GEMINI_API_KEY for full AI)')}`);
    console.log('\nRun ' + chalk.cyan('devghost demo') + ' to test simulated error diagnosis!\n');
  });

// Subcommand: demo
program
  .command('demo')
  .description('Run an interactive demo showing how DevGhost intercepts crashes')
  .action(async () => {
    console.log(chalk.bold.cyan('\n─── 👻 Running DevGhost Interactive Demo ───────────\n'));
    console.log(chalk.gray('Simulating a real crash: "npm run dev" failing due to port 3000 collision...\n'));

    const demoContext = harvestContext(
      'npm run dev',
      1,
      'Error: listen EADDRINUSE: address already in use :::3000 at Server.setupListenHandle [as _listen2] (node:net:1898:21)'
    );

    const diagnosis = runHeuristicRules(demoContext)!;
    console.log(renderDiagnosis(diagnosis, demoContext));
    await promptAndExecute(diagnosis, demoContext);
  });

program.parse(process.argv);
