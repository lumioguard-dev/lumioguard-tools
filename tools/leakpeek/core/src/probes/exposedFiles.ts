import type { ExposureFinding } from '../domain/ExposureFinding.js';

/**
 * Files that should never be served but often are: a build that copies the repo
 * root into the web root ships `.env` and `.git` with it. A 200 counts only when
 * the body looks like the file, never when it looks like an SPA's HTML shell.
 */

export interface ExposedFileCheck {
  readonly path: string;
  readonly code: string;
  readonly severity: 'critical' | 'high';
  readonly title: string;
  readonly detail: string;
  readonly looksLikeFile: (body: string) => boolean;
  readonly fix: string;
}

const looksLikeHtml = (body: string): boolean => /^\s*<(!doctype|html|\?xml)/i.test(body);

export const EXPOSED_FILE_CHECKS: readonly ExposedFileCheck[] = Object.freeze([
  {
    path: '/.env',
    code: 'file:env',
    severity: 'critical',
    title: 'The .env file is served in production',
    detail:
      'The environment file is publicly downloadable. It usually holds database URLs, API keys and secrets: everything meant to stay on the server.',
    looksLikeFile: (b) => !looksLikeHtml(b) && /^[A-Z][A-Z0-9_]*=/m.test(b),
    fix: 'Stop serving dotfiles from the web root, and rotate every secret the file contained.',
  },
  {
    path: '/.git/config',
    code: 'file:git',
    severity: 'high',
    title: 'The .git directory is served in production',
    detail:
      'The git repository is publicly reachable. It lets anyone reconstruct your full source history, including any secrets ever committed.',
    looksLikeFile: (b) => !looksLikeHtml(b) && /\[core\]|\[remote/i.test(b),
    fix: 'Block access to /.git and remove the directory from the deployed build.',
  },
]);

/** What one file read means. Returns a finding only when the body confirms it. */
export function interpretExposedFile(
  check: ExposedFileCheck,
  status: number,
  body: string,
): ExposureFinding | null {
  if (status !== 200 || !check.looksLikeFile(body)) return null;
  return {
    code: check.code,
    severity: check.severity,
    category: 'exposed-file',
    title: check.title,
    detail: check.detail,
    evidence: `${check.path} is served (HTTP 200, ${body.length} bytes)`,
    fix: check.fix,
  };
}
