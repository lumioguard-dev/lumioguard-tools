import type { ExposureFinding } from '../domain/ExposureFinding.js';

/**
 * Low severity by design: an absent header is a hardening gap, not an open door,
 * and weighing it like a readable database teaches people to ignore the colour.
 * Only the ones whose absence has a concrete attack are here, not a checklist.
 */

interface HeaderRule {
  readonly code: string;
  readonly header: string;
  readonly title: string;
  readonly detail: string;
  readonly fix: string;
}

const RULES: readonly HeaderRule[] = [
  {
    code: 'header:csp',
    header: 'content-security-policy',
    title: 'No Content-Security-Policy',
    detail:
      'Without a CSP, a single injected script runs with full access to the page: the main defence against XSS is simply absent.',
    fix: "Add a Content-Security-Policy header, starting from default-src 'self'.",
  },
  {
    code: 'header:hsts',
    header: 'strict-transport-security',
    title: 'No Strict-Transport-Security',
    detail:
      'Without HSTS, a first request can be downgraded to plain HTTP and intercepted before the redirect to HTTPS.',
    fix: 'Add Strict-Transport-Security: max-age=63072000; includeSubDomains.',
  },
  {
    code: 'header:frame',
    header: 'x-frame-options',
    title: 'No clickjacking protection',
    detail:
      'With neither X-Frame-Options nor a frame-ancestors CSP directive, the site can be framed and clickjacked.',
    fix: "Add X-Frame-Options: DENY, or frame-ancestors 'none' in the CSP.",
  },
];

export function checkSecurityHeaders(headers: Record<string, string>): ExposureFinding[] {
  const csp = headers['content-security-policy'] ?? '';
  const findings: ExposureFinding[] = [];

  for (const rule of RULES) {
    if (headers[rule.header]) continue;
    // A frame-ancestors directive covers the clickjacking case even with no
    // X-Frame-Options header, so it is not missing if the CSP handles it.
    if (rule.code === 'header:frame' && /frame-ancestors/i.test(csp)) continue;
    findings.push({
      code: rule.code,
      severity: 'low',
      category: 'security-header',
      title: rule.title,
      detail: rule.detail,
      evidence: null,
      fix: rule.fix,
    });
  }

  return findings;
}
