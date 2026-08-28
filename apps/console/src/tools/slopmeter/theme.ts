import { band } from '@lumioguard/design-tokens';
import { SCORE_MAX, TIER_BANDS, type Tier } from '@lumioguard/shared';
import { type InkedBand, type VerdictScale, inkedBands, verdictScale } from '@lumioguard/ui';
import { costInk } from '../../theme/cost.js';

/** Tier is Slopmeter's vocabulary, which the token package stays free of. */
const TIER_INK: Record<Tier, string> = {
  Handmade: band.calm,
  'Lightly Templated': band.notice,
  'Heavily Templated': band.warn,
  Slop: band.alarm,
};

export function tierInk(tier: Tier): string {
  return TIER_INK[tier];
}

export const BANDS: readonly InkedBand[] = inkedBands(TIER_BANDS, SCORE_MAX, tierInk);

/**
 * So a +35 tell does not read the same as a +3. Small weights stay in plain ink:
 * a page where every line is coloured has no hierarchy left to spend.
 */
export function weightInk(weight: number): string {
  return costInk(weight);
}
export const VERDICT_SCALE: VerdictScale = verdictScale(BANDS, SCORE_MAX);
