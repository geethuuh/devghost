import type { ErrorContext, DiagnosisResult } from '../types.js';

export function runHeuristicRules(ctx: ErrorContext): DiagnosisResult | null {
  const combined = `${ctx.command}\n${ctx.output}`;

  // 1. Port Conflict (EADDRINUSE)
  const portMatch = combined.match(/EADDRINUSE.*?(\d{2,5})|address already in use.*?(\d{2,5})|port (\d{2,5}) is already in use/i);
  if (portMatch) {
    const port = portMatch[1] || portMatch[2] || portMatch[3];
    const isWindows = ctx.platform === 'win32';
    const fixCmd = isWindows
      ? `npx kill-port ${port}`
      : `npx kill-port ${port}`;

    return {
      category: 'port_conflict',
      title: `Port ${port} Conflict (EADDRINUSE)`,
      rootCause: `Another background process is already bound to local port ${port}.`,
      explanation: `Your application failed to start because port ${port} is occupied by another running server, container, or zombie process.`,
      fixCommand: fixCmd,
      fixDescription: `Free up port ${port} by terminating the occupying process.`,
      confidence: 0.98,
      source: 'heuristic',
    };
  }

  // 2. Missing Node.js Package (Cannot find module)
  const moduleMatch = combined.match(/(?:Cannot find module|Module not found: Can't resolve) ['"]([^'".\\/][^'"]*)['"]/i);
  if (moduleMatch && !moduleMatch[1].startsWith('.')) {
    const pkg = moduleMatch[1].split('/')[0]; // handle scoped or subpaths
    return {
      category: 'missing_dependency',
      title: `Missing Dependency: '${pkg}'`,
      rootCause: `Package '${pkg}' is imported in code but not installed in node_modules.`,
      explanation: `Node.js runtime or bundler could not locate the package '${pkg}'. Installing it will resolve this crash.`,
      fixCommand: `npm install ${pkg}`,
      fixDescription: `Install '${pkg}' and add it to package.json.`,
      confidence: 0.95,
      source: 'heuristic',
    };
  }

  // 3. Git No Upstream Branch
  const gitUpstreamMatch = combined.match(/fatal: The current branch (.*) has no upstream branch/i) ||
                           combined.match(/git push --set-upstream origin ([\w.-]+)/i);
  if (gitUpstreamMatch) {
    const branch = gitUpstreamMatch[1]?.trim() || ctx.gitBranch || 'main';
    return {
      category: 'git_issue',
      title: `Git Branch Has No Remote Tracking`,
      rootCause: `Local branch '${branch}' has not been linked to a remote branch on origin.`,
      explanation: `Git does not know which remote branch to push to. You need to configure the tracking upstream.`,
      fixCommand: `git push --set-upstream origin ${branch}`,
      fixDescription: `Push branch '${branch}' and set remote tracking.`,
      confidence: 0.99,
      source: 'heuristic',
    };
  }

  // 4. Git Uncommitted Changes Preventing Pull/Checkout
  if (/local changes to the following files would be overwritten by merge/i.test(combined)) {
    return {
      category: 'git_issue',
      title: `Git Working Tree Conflict`,
      rootCause: `You have unstaged or uncommitted local changes that clash with incoming remote commits.`,
      explanation: `Git stops you from losing your local work. Stashing your changes allows the pull to succeed cleanly.`,
      fixCommand: `git stash && git pull && git stash pop`,
      fixDescription: `Safely stash current edits, pull latest updates, and restore edits.`,
      confidence: 0.92,
      source: 'heuristic',
    };
  }

  // 5. Common CLI Command Typos
  const typoMap: Record<string, string> = {
    gti: 'git',
    npn: 'npm',
    nmp: 'npm',
    dcoker: 'docker',
    dockr: 'docker',
    pyhton: 'python',
    pytohn: 'python',
    sl: 'ls',
    claer: 'clear',
  };

  const firstWord = ctx.command.split(' ')[0]?.toLowerCase();
  if (firstWord && typoMap[firstWord]) {
    const correctedCmd = ctx.command.replace(new RegExp(`^${firstWord}`, 'i'), typoMap[firstWord]);
    return {
      category: 'command_not_found',
      title: `Command Typo Detected: '${firstWord}' -> '${typoMap[firstWord]}'`,
      rootCause: `The command '${firstWord}' does not exist. It looks like a typo for '${typoMap[firstWord]}'.`,
      explanation: `Running the corrected executable name will resolve the error.`,
      fixCommand: correctedCmd,
      fixDescription: `Run '${correctedCmd}'.`,
      confidence: 0.99,
      source: 'heuristic',
    };
  }

  // 6. Python Missing Module
  const pyModuleMatch = combined.match(/ModuleNotFoundError: No module named ['"]([^'"]+)['"]/i);
  if (pyModuleMatch) {
    const pyPkg = pyModuleMatch[1];
    return {
      category: 'missing_dependency',
      title: `Missing Python Package: '${pyPkg}'`,
      rootCause: `Python module '${pyPkg}' is not installed in the active environment.`,
      explanation: `Your script imported '${pyPkg}', but pip has not installed it yet.`,
      fixCommand: `pip install ${pyPkg}`,
      fixDescription: `Install '${pyPkg}' using pip.`,
      confidence: 0.95,
      source: 'heuristic',
    };
  }

  // 7. Missing node_modules
  if (/ERR_MODULE_NOT_FOUND/i.test(combined) && combined.includes('node_modules')) {
    return {
      category: 'missing_dependency',
      title: `Project Dependencies Missing`,
      rootCause: `One or more packages are missing from 'node_modules'.`,
      explanation: `Dependencies specified in your package.json have not been fully installed.`,
      fixCommand: `npm install`,
      fixDescription: `Run a clean dependency installation.`,
      confidence: 0.90,
      source: 'heuristic',
    };
  }

  // 8. EACCES Permission Denied
  if (/EACCES|permission denied/i.test(combined)) {
    return {
      category: 'permission_denied',
      title: `Permission Denied (EACCES)`,
      rootCause: `The current process does not have permission to read/write the requested file or resource.`,
      explanation: `Ensure the file is not locked by another process or elevate permissions if needed.`,
      confidence: 0.85,
      source: 'heuristic',
    };
  }

  return null;
}
