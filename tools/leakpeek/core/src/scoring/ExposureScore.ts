import {
  EXPOSURE_CRITICAL_CEILING,
  EXPOSURE_MAX,
  EXPOSURE_MIN,
  type ExposureTier,
  exposureBandFor,
} from '@lumioguard/shared';
import type { Severity } from '@lumioguard/shared';
import type { ExposureFinding } from '../domain/ExposureFinding.js';

/**
 * Findings to an Exposure Score (0-100, higher is BETTER). Weights are a FIRST
 * CUT, not measured; see the README. One critical pins the score into Wide Open
 * on its own, because a readable user table is the whole story.
 */
const WEIGHT: Record<Severity, number> = { critical: 40, high: 22, medium: 9, low: 3 };

/**
 * What one finding costs, for a surface ranking findings from several tools
 * against each other. Read FROM the scorer's own table: a retuned weight that
 * moved the score but not the ordering would be invisible, both lists sorted.
 */
export function weightOf(severity: Severity): number {
  return WEIGHT[severity];
}

/**
 * A critical cannot score above the ceiling of the worst band. Taken FROM the
 * band rather than written again: the two must agree, and as separate literals
 * they could not fail together.
 */
const CRITICAL_CEILING = EXPOSURE_CRITICAL_CEILING;

export interface ScoredExposure {
  readonly score: number;
  readonly tier: ExposureTier;
  readonly tierDescription: string;
  readonly counts: Record<Severity, number>;
}

export function scoreExposure(findings: readonly ExposureFinding[]): ScoredExposure {
  const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  let sum = 0;
  for (const finding of findings) {
    counts[finding.severity] += 1;
    sum += WEIGHT[finding.severity];
  }

  /**
   * The penalty is subtracted from the top, ONCE, here. Rules produce a cost,
   * because that is what a rule can say; the scale the reader sees runs the
   * other way, and this is the only line that knows it.
   */
  const capped =
    counts.critical > 0 ? Math.min(EXPOSURE_MAX - sum, CRITICAL_CEILING) : EXPOSURE_MAX - sum;
  const score = Math.max(EXPOSURE_MIN, Math.min(EXPOSURE_MAX, capped));
  const band = exposureBandFor(score);

  return { score, tier: band.tier, tierDescription: band.description, counts };
}
