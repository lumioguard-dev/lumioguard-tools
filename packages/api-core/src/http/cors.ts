import type { MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';

/**
 * Who may call this Worker from a browser, read from `ALLOWED_ORIGINS`.
 *
 * `*` allows everything and is the development default. Otherwise the value is
 * a comma-separated list of origins, and an entry may carry ONE wildcard label:
 * `https://*.example.pages.dev` matches any subdomain of `example.pages.dev`.
 *
 * The wildcard exists for preview deployments. Cloudflare Pages gives every
 * branch its own `<branch>.<project>.pages.dev` host, so an exact list can only
 * ever name the branches that already existed, and testing a change means
 * watching every reading fail CORS with nothing useful on screen.
 *
 * It matches a subdomain of the named host, never the bare host and never a
 * suffix: `.pages.dev` alone would hand the API to anybody else's project.
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
 * Compared as a parsed URL rather than as text. An `endsWith` on the raw string
 * would accept `https://evil.test` for a pattern ending in the allowed host as
 * soon as anything is appended to it, and an Origin header is attacker-chosen.
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
