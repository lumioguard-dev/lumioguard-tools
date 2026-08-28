import type { CiteFinding } from '../domain/CiteFinding.js';

/**
 * The single worst finding, in the finding's own words, so the headline can
 * never describe something that was not found. `absent` is skipped: it costs
 * nothing, so headlining it announces a problem the score says is not one.
 */
export function headlineFor(ordered: readonly CiteFinding[]): string | null {
  return ordered.find((item) => item.impact !== 'absent')?.title ?? null;
}
