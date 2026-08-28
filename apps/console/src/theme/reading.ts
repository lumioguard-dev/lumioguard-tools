import { band } from '@lumioguard/design-tokens';
import { READING_BANDS, READING_MAX, type ReadingTier } from '@lumioguard/shared';
import { type InkedBand, type VerdictScale, inkedBands, verdictScale } from '@lumioguard/ui';

/**
 * ReadingTier is the console's vocabulary, so the mapping lives here rather than
 * in the tokens. The consolidated score is always some tool's own score, so a
 * Critical here and a Wide Open in Leakpeek's chip must be the same colour.
 */
const TIER_INK: Record<ReadingTier, string> = {
  Clean: band.calm,
  Marked: band.notice,
  Serious: band.warn,
  Critical: band.alarm,
};

export const BANDS: readonly InkedBand[] = inkedBands(
  READING_BANDS,
  READING_MAX,
  (tier) => TIER_INK[tier],
);

export const VERDICT_SCALE: VerdictScale = verdictScale(BANDS, READING_MAX);
