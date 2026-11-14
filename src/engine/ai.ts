import type { ErrorContext, DiagnosisResult } from '../types.js';

export async function runAIDiagnosis(ctx: ErrorContext): Promise<DiagnosisResult | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.DEVGHOST_API_KEY;

  if (!apiKey) {
    return null;
  }

  const prompt = `You are DevGhost, an elite developer terminal assistant.
A developer executed the following shell command which failed with exit code ${ctx.exitCode}:

Command: ${ctx.command}
Working Directory: ${ctx.cwd}
OS / Platform: ${ctx.platform}
Git Branch: ${ctx.gitBranch || 'N/A'}

Error / Output:
${ctx.output.slice(0, 1500)}

Analyze this failure and return ONLY a JSON object (no markdown code blocks, no prose) matching this exact schema:
{
  "category": "syntax_error" | "missing_dependency" | "port_conflict" | "git_issue" | "general_runtime",
  "title": "Short title describing the error (max 6 words)",
  "rootCause": "Exact 1-sentence technical root cause",
  "explanation": "Clear explanation of why this error happened",
  "fixCommand": "The exact shell command to run to fix this (or null if not automatically fixable)",
  "fixDescription": "1-sentence describing what the fix command does"
}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    const parsed = JSON.parse(candidateText);
    return {
      category: parsed.category || 'general_runtime',
      title: parsed.title || 'Runtime Error Detected',
      rootCause: parsed.rootCause || 'Command failed with non-zero exit code.',
      explanation: parsed.explanation || '',
      fixCommand: parsed.fixCommand || undefined,
      fixDescription: parsed.fixDescription || undefined,
      confidence: 0.94,
      source: 'ai',
    };
  } catch {
    return null;
  }
}
