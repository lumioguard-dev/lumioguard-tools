import {
  CITATION_BLOCKING_CEILING,
  CITATION_MAX,
  CITATION_MIN,
  type CitationTier,
  type Impact,
  citationBandFor,
} from '@lumioguard/shared';
import type { CiteFinding } from '../domain/CiteFinding.js';

/**
 * Findings to a citation score (0-100, higher is BETTER). Calibrated so a page
 * answer engines demonstrably quote comes out Legible; `minor` is 2 because
 * minors co-occur and nginx carries eight. See the README for the corpus.
 */
const WEIGHT: Record<Impact, number> = { blocker: 34, major: 10, minor: 2, absent: 0 };

/**
 * What one finding costs, for a surface ranking findings from several tools
 * against each other. Read FROM the scorer's own table: a retuned weight that
 * moved the score but not the ordering would be invisible, both lists sorted.
 */
export function weightOf(impact: Impact): number {
  return WEIGHT[impact];
}

export interface ScoredCitation {
  readonly score: number;
  readonly tier: CitationTier;
  readonly tierDescription: string;
  readonly counts: Record<Impact, number>;
}

export function scoreCitation(findings: readonly CiteFinding[]): ScoredCitation {
  const counts: Record<Impact, number> = { blocker: 0, major: 0, minor: 0, absent: 0 };
  let sum = 0;
  for (const item of findings) {
    counts[item.impact] += 1;
    sum += WEIGHT[item.impact];
  }

  /**
   * The penalty is subtracted from the top, ONCE, here. Rules produce a cost,
   * because that is what a rule can say; the scale the reader sees runs the
   * other way, and this is the only line that knows it.
   */
  const capped =
    counts.blocker > 0
      ? Math.min(CITATION_MAX - sum, CITATION_BLOCKING_CEILING)
      : CITATION_MAX - sum;
  const score = Math.max(CITATION_MIN, Math.min(CITATION_MAX, capped));
  const band = citationBandFor(score);

  return { score, tier: band.tier, tierDescription: band.description, counts };
}
