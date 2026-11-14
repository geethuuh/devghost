import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ErrorContext } from '../types.js';

export function harvestContext(command: string, exitCode: number, errorOutput: string): ErrorContext {
  const cwd = process.cwd();
  let gitBranch: string | undefined;
  let gitStatus: string | undefined;

  // Try extracting git metadata safely without throwing
  try {
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf-8',
    }).trim();

    gitStatus = execSync('git status --porcelain', {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf-8',
    }).trim();
  } catch {
    // Not a git repository or git command failed; gracefully ignore
  }

  return {
    command: command.trim(),
    exitCode,
    output: errorOutput.trim(),
    cwd,
    gitBranch,
    gitStatus,
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString(),
  };
}
