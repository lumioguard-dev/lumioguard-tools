import type { MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';

/**
 * Who may call this Worker from a browser. `*` is the development default;
 * otherwise a comma-separated list where an entry may carry one wildcard label,
 * `https://*.example.pages.dev`, because Pages gives every branch its own host.
 */
export function corsFor(configured: string | undefined): MiddlewareHandler {
  const value = configured ?? '*';
  if (value === '*') {
    return cors({ origin: '*', allowMethods: ['GET', 'POST', 'OPTIONS'] });
  }

  const patterns = value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');

  return cors({
    origin: (origin) => (patterns.some((pattern) => matches(pattern, origin)) ? origin : null),
    allowMethods: ['GET', 'POST', 'OPTIONS'],
  });
}

/**
 * Parsed, never string-matched: the Origin header is attacker-chosen, and an
 * `endsWith` takes `evil-example.pages.dev` for `*.example.pages.dev`. The
 * wildcard is a subdomain of one host, never a bare suffix like `.pages.dev`.
 */
function matches(pattern: string, origin: string): boolean {
  if (pattern === origin) return true;
  if (!pattern.includes('*')) return false;

  const wanted = parse(pattern.replace('*.', ''));
  const actual = parse(origin);
  if (wanted === null || actual === null) return false;

  return (
    actual.protocol === wanted.protocol &&
    actual.port === wanted.port &&
    actual.hostname.endsWith(`.${wanted.hostname}`)
  );
}

function parse(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}
