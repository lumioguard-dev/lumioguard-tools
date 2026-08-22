/**
 * Where this deployment answers. From the environment, never a literal: a fork
 * shipping our canonical is `document.foreign-canonical`, a blocker. It MAY
 * carry a path, and is then the only place the mount point is written.
 */
export const SITE_URL_VAR = 'VITE_PUBLIC_SITE_URL';

export interface Site {
  /** Absolute, no trailing slash: `https://lumioguard.dev/tools`. */
  readonly base: string;
  /** The mount point for links, no trailing slash. Empty at the root. */
  readonly path: string;
}

/**
 * Where the app is served, or null when nothing was configured.
 *
 * A malformed value throws rather than falling back to null: quietly omitting
 * everything ships a deployment that looks built and carries no metadata.
 */
export function site(env: Readonly<Record<string, unknown>>): Site | null {
  const url = configuredUrl(env);
  if (url === null) return null;

  const path = url.pathname.replace(/\/+$/, '');
  return { base: `${url.origin}${path}`, path };
}

/**
 * What Vite mounts assets under, which needs the trailing slash it omits
 * everywhere else. `/` when nothing is configured, which is Vite's own default.
 */
export function assetBase(env: Readonly<Record<string, unknown>>): string {
  const where = site(env);
  return where === null || where.path === '' ? '/' : `${where.path}/`;
}

function configuredUrl(env: Readonly<Record<string, unknown>>): URL | null {
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
  return url;
}

/**
 * An absolute URL on this site, for a path that always starts with a slash.
 *
 * Takes the base rather than the origin, so a mounted app's links carry the
 * mount point without a single call site knowing there is one.
 */
export function absolute(base: string, path: string): string {
  return `${base}${path}`;
}
