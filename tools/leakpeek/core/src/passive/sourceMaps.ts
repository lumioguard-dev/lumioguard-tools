import type { ExposureFinding } from '../domain/ExposureFinding.js';

/** Source maps shipped to production. */

const SOURCE_MAPPING = /\/\/#\s*sourceMappingURL=(\S+)/;

/** The `sourceMappingURL` a script points at, or null. Relative or absolute. */
export function sourceMapPointer(scriptBody: string): string | null {
  const match = scriptBody.match(SOURCE_MAPPING);
  const url = match?.[1];
  // A data: URI is inlined, not served separately, so it is not a fetchable
  // exposure of its own — the bundle already contains it either way.
  if (!url || url.startsWith('data:')) return null;
  return url;
}

export function sourceMapFinding(mapUrl: string): ExposureFinding {
  return {
    code: 'source-map',
    severity: 'medium',
    category: 'source-map',
    title: 'Source maps are served in production',
    detail:
      'A source map exposes your original, readable source to anyone — comments and all. It often reveals structure and endpoints a minified bundle hid.',
    evidence: `Reachable source map at ${mapUrl}`,
    fix: 'Disable source-map output for production builds, or stop serving the .map files.',
  };
}
