import { EXPOSURE_MAX, EXPOSURE_MIN, type ExposureTier, exposureBandFor } from '@lumioguard/shared';
import type { Severity } from '@lumioguard/shared';
import type { ExposureFinding } from '../domain/ExposureFinding.js';

/**
 * Findings → an Exposure Score (0–100, higher is worse) and a tier.
 *
 * The weights and the critical floor are a FIRST CUT, not a measured result —
 * Leakpeek has no corpus to tune against yet (see the README). They are
 * gathered here, named, so retuning is one edit and a test, never a hunt
 * through the engine.
 *
 * The shape of the rule, which is the part that matters: one critical finding
 * pins the score into the Wide Open band on its own, because a single readable
 * user table or a live master key is the whole story — however many lesser
 * things are also true. Below that floor the score is additive and clamped.
 */
const WEIGHT: Record<Severity, number> = { critical: 40, high: 22, medium: 9, low: 3 };

/** A critical cannot score below this — the floor of the Wide Open band. */
const CRITICAL_FLOOR = 60;

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

  const floored = counts.critical > 0 ? Math.max(sum, CRITICAL_FLOOR) : sum;
  const score = Math.max(EXPOSURE_MIN, Math.min(EXPOSURE_MAX, floored));
  const band = exposureBandFor(score);

  return { score, tier: band.tier, tierDescription: band.description, counts };
}
