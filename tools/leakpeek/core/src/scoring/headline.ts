import type { ExposureFinding } from '../domain/ExposureFinding.js';

/**
 * The single worst finding, in the finding's own words — so the headline can
 * never describe something that was not found. Null when nothing was found, and
 * the surface falls back to what the tier means. Assumes findings are already
 * ordered worst-first (see orderFindings).
 */
export function headlineFor(ordered: readonly ExposureFinding[]): string | null {
  return ordered[0]?.title ?? null;
}
