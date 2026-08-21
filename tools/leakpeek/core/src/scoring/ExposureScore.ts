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
 * Findings → an Exposure Score (0–100, higher is BETTER) and a tier.
 *
 * The weights and the critical floor are a FIRST CUT, not a measured result:
 * Leakpeek has no corpus to tune against yet (see the README). They are
 * gathered here, named, so retuning is one edit and a test, never a hunt
 * through the engine.
 *
 * The shape of the rule, which is the part that matters: one critical finding
 * pins the score into the Wide Open band on its own, because a single readable
 * user table or a live master key is the whole story: however many lesser
 * things are also true. Below that floor the score is additive and clamped.
 */
const WEIGHT: Record<Severity, number> = { critical: 40, high: 22, medium: 9, low: 3 };

/**
 * What one finding costs, for a surface that has to rank findings from several
 * tools against each other. Read FROM the scorer's own table rather than copied
 * beside it: a retuned weight that moved the score but not the ordering would
 * be invisible, because both lists would still look sorted.
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
   * The penalty is subtracted from the top, ONCE, here.
   *
   * The rules produce a cost, because that is what a rule can say. The scale
   * the reader sees runs the other way, and this is the only line that knows
   * it: everything above counts against the site, everything below reads a
   * number where 100 is a site leaking nothing.
   */
  const capped =
    counts.critical > 0 ? Math.min(EXPOSURE_MAX - sum, CRITICAL_CEILING) : EXPOSURE_MAX - sum;
  const score = Math.max(EXPOSURE_MIN, Math.min(EXPOSURE_MAX, capped));
  const band = exposureBandFor(score);

  return { score, tier: band.tier, tierDescription: band.description, counts };
}
