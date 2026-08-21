/**
 * Where this deployment answers. A canonical, an OpenGraph URL and a sitemap
 * entry are absolute by definition and cannot be written without it.
 *
 * From the environment, never a literal: this repo is public, and a fork would
 * otherwise ship a canonical pointing at our host. That is
 * `document.foreign-canonical`, a blocker. Unset writes none of them, because a
 * wrong canonical hands the page's standing to another address.
 */
export const SITE_URL_VAR = 'VITE_PUBLIC_SITE_URL';

/**
 * The origin, or null when none was configured.
 *
 * A malformed value throws rather than falling back to null: quietly omitting
 * everything ships a deployment that looks built and carries no metadata.
 */
export function siteOrigin(env: Readonly<Record<string, unknown>>): string | null {
  const raw = env[SITE_URL_VAR];
  if (typeof raw !== 'string' || raw.trim() === '') return null;

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error(`${SITE_URL_VAR} is not a URL: ${raw}`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`${SITE_URL_VAR} must be http or https, not ${url.protocol}`);
  }
  return url.origin;
}

/** An absolute URL on this site, for a path that always starts with a slash. */
export function absolute(origin: string, path: string): string {
  return `${origin}${path}`;
}
