import { band, ink, red, state } from '@lumioguard/design-tokens';
import {
  SCORE_MAX,
  TIER_BANDS,
  type Tier,
  type TierBand,
  type TrackSegment,
  bandTrack,
} from '@lumioguard/shared';
import type { VerdictScale } from '@lumioguard/ui';

/**
 * Tier is a slopmeter concept; the token package stays free of any one
 * tool's vocabulary, so the mapping lives here.
 */
const TIER_INK: Record<Tier, string> = {
  Handmade: band.calm,
  'Lightly Templated': band.notice,
  'Heavily Templated': band.warn,
  Slop: band.alarm,
};

export function tierInk(tier: Tier): string {
  return TIER_INK[tier];
}

export interface InkedBand extends TierBand {
  readonly ink: string;
  readonly track: TrackSegment;
}

/** The shared ladder, with the one thing the surface adds to it. */
export const BANDS: readonly InkedBand[] = TIER_BANDS.map((tierBand) => ({
  ...tierBand,
  ink: TIER_INK[tierBand.tier],
  track: bandTrack(tierBand),
}));

/**
 * Weight bands, so a +35 tell does not read the same as a +3. Charges take the
 * second pen; credits take the hand's blue. Small weights stay in plain ink:
 * a page where every line is coloured has no hierarchy left to spend.
 */
export function weightInk(weight: number): string {
  if (weight < 0) return state.success.fg;
  if (weight >= 16) return red[400];
  if (weight >= 8) return red[300];
  return ink[2];
}
/**
 * The instrument's configuration: what varies about drawing a Slop verdict.
 *
 * `inkFor` takes a plain string, because the component draws every tool's ladder
 * and knows none of their vocabularies. Looked up rather than asserted: casting
 * the string to a Tier would hand `TIER_INK` a key it may not have, and the miss
 * is `undefined`, which reaches an inline style and paints the seal with no
 * colour at all, on the one element the whole report is built around.
 */
export const VERDICT_SCALE: VerdictScale = {
  bands: BANDS,
  max: SCORE_MAX,
  inkFor: (tier) => BANDS.find((candidate) => candidate.tier === tier)?.ink ?? ink[2],
  wordmark: 'SLOPMETER',
};
