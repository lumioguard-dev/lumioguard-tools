import type { CiteFinding } from '../domain/CiteFinding.js';

/**
 * The single worst finding, in the finding's own words, so the headline can
 * never describe something that was not found. Null when nothing was found and
 * the surface falls back to what the tier means. Assumes the findings are
 * already ordered worst-first (see orderFindings).
 *
 * `absent` is skipped, because it costs nothing: a page whose only entries are
 * flags scores zero, and headlining it "No canonical URL" would announce a
 * problem the score has already said is not one.
 */
export function headlineFor(ordered: readonly CiteFinding[]): string | null {
  return ordered.find((item) => item.impact !== 'absent')?.title ?? null;
}
