import type { ExposureFinding } from '../domain/ExposureFinding.js';

/**
 * Secrets baked into the served client bundle — the most common real leak on an
 * AI-built site, and fully passive: it is read from what the browser already
 * downloaded, nothing is probed.
 *
 * Two things this must get right. First, evidence is MASKED here, at the source,
 * so a raw key never travels further than this function — the report proves the
 * key exists without reprinting it (see the README). Second, a
 * Supabase `anon` key in a bundle is NORMAL and is not reported: it is public by
 * design. Only the `service_role` key is a leak, and the two are told apart by
 * decoding the JWT and reading its `role` claim, never by pattern alone.
 */

interface SecretRule {
  readonly code: string;
  readonly label: string;
  readonly pattern: RegExp;
  readonly detail: string;
  readonly fix: string;
}

/** A JWT: three base64url segments. Supabase keys are JWTs; the role is inside. */
const JWT = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;

const RULES: readonly SecretRule[] = [
  {
    code: 'secret:openai',
    label: 'OpenAI API key',
    pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g,
    detail:
      'An OpenAI key is in the client bundle. Anyone can read it and spend against your account.',
    fix: 'Move the key server-side (an API route or Edge Function) and revoke this one.',
  },
  {
    code: 'secret:stripe-live',
    label: 'Stripe live secret key',
    pattern: /\bsk_live_[A-Za-z0-9]{20,}\b/g,
    detail: 'A Stripe LIVE secret key is in the bundle. It can move real money.',
    fix: 'Roll the key in the Stripe dashboard now, and keep secret keys server-side only.',
  },
  {
    code: 'secret:aws',
    label: 'AWS access key id',
    pattern: /\bAKIA[0-9A-Z]{16}\b/g,
    detail: 'An AWS access key id is in the bundle, usually paired with a secret nearby.',
    fix: 'Deactivate the key in IAM and issue credentials the browser never sees.',
  },
  {
    code: 'secret:google',
    label: 'Google API key',
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g,
    detail: 'A Google API key is in the bundle. Restrict it, or anyone can bill against it.',
    fix: 'Add HTTP-referrer and API restrictions in the Google console, or move it server-side.',
  },
  {
    code: 'secret:github-pat',
    label: 'GitHub token',
    pattern: /\bgh[pousr]_[A-Za-z0-9]{36}\b/g,
    detail: 'A GitHub token is in the bundle. It can read or write your repositories.',
    fix: 'Revoke the token in GitHub settings and never ship one to the client.',
  },
];

/** Mask a secret so its presence is provable without reprinting it. */
export function maskSecret(secret: string): string {
  if (secret.length <= 10) return `${secret.slice(0, 2)}…`;
  return `${secret.slice(0, 4)}…${secret.slice(-3)}`;
}

/** Decode a JWT payload's `role` claim, or null when it is not a readable JWT. */
export function jwtRole(token: string): string | null {
  const payload = token.split('.')[1];
  if (payload === undefined) return null;
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null || !('role' in parsed)) return null;
    const role = (parsed as { role: unknown }).role;
    return typeof role === 'string' ? role : null;
  } catch {
    return null;
  }
}

/**
 * Scan bundle text for leaked secrets. `sources` is the served HTML plus every
 * script body fetched from it, concatenated by the caller.
 */
export function scanForSecrets(sources: string): ExposureFinding[] {
  const findings: ExposureFinding[] = [];
  const seen = new Set<string>();

  // Supabase service_role: a JWT whose decoded role is service_role. The anon
  // key is a JWT too and is deliberately NOT reported — it is meant to be public.
  for (const token of sources.match(JWT) ?? []) {
    if (jwtRole(token) !== 'service_role') continue;
    const key = `service_role:${token.slice(0, 12)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    findings.push({
      code: 'secret:supabase-service-role',
      severity: 'critical',
      category: 'exposed-secret',
      title: 'Supabase service_role key is in the client bundle',
      detail:
        'The service_role key bypasses every Row Level Security policy. Shipped to the browser, it hands anyone full read and write to your entire database.',
      evidence: `service_role JWT found, ${maskSecret(token)} (decoded role: service_role)`,
      fix: 'Rotate the key in Supabase now, and use it only on the server. The browser needs the anon key alone.',
    });
  }

  for (const rule of RULES) {
    for (const match of sources.match(rule.pattern) ?? []) {
      const key = `${rule.code}:${match.slice(0, 12)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({
        code: rule.code,
        severity: 'high',
        category: 'exposed-secret',
        title: `${rule.label} is in the client bundle`,
        detail: rule.detail,
        evidence: `${rule.label} found, ${maskSecret(match)}`,
        fix: rule.fix,
      });
    }
  }

  return findings;
}
