/**
 * The app is served at a host root AND under a path, so every internal link is
 * built from here rather than written absolute.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function href(path: string): string {
  return `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
