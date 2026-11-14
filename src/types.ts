export interface ErrorContext {
  command: string;
  exitCode: number;
  output: string;
  cwd: string;
  gitBranch?: string;
  gitStatus?: string;
  nodeVersion?: string;
  platform: string;
  timestamp: string;
}

export type ErrorCategory =
  | 'port_conflict'
  | 'missing_dependency'
  | 'git_issue'
  | 'command_not_found'
  | 'permission_denied'
  | 'syntax_error'
  | 'general_runtime';

export interface DiagnosisResult {
  category: ErrorCategory;
  title: string;
  explanation: string;
  rootCause: string;
  fixCommand?: string;
  fixDescription?: string;
  confidence: number; // 0.0 to 1.0
  source: 'heuristic' | 'ai';
}
