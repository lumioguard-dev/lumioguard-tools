import { band, ink } from '@lumioguard/design-tokens';
import {
  READING_BANDS,
  READING_MAX,
  type ReadingBand,
  type ReadingTier,
  readingBandTrack,
} from '@lumioguard/shared';
import type { VerdictScale } from '@lumioguard/ui';

/**
 * ReadingTier is the console's vocabulary; the token package stays free of any
 * one surface's words, so the mapping lives here.
 *
 * The same four inks every tool uses for the same four bands. The consolidated
 * score is always some tool's own score, so a reading that comes out Critical
 * here and Wide Open in Leakpeek's own chip must be painted the same colour, or
 * the page shows one number in two colours and invites the reader to pick.
 */
const TIER_INK: Record<ReadingTier, string> = {
  Clean: band.calm,
  Marked: band.notice,
  Serious: band.warn,
  Critical: band.alarm,
};

export interface InkedBand extends ReadingBand {
  readonly ink: string;
  readonly track: { readonly left: number; readonly width: number };
}

export const BANDS: readonly InkedBand[] = READING_BANDS.map((readingBand) => ({
  ...readingBand,
  ink: TIER_INK[readingBand.tier],
  track: readingBandTrack(readingBand),
}));

/**
 * `inkFor` takes a plain string and LOOKS IT UP rather than asserting: casting
 * to a ReadingTier would hand the record a key it may not have, and the miss is
 * `undefined`, which reaches an inline style and paints the seal with no colour
 * at all, on the one element the whole report is built around.
 */
export const VERDICT_SCALE: VerdictScale = {
  bands: BANDS,
  max: READING_MAX,
  inkFor: (tier) => BANDS.find((candidate) => candidate.tier === tier)?.ink ?? ink[2],
  // NOT the parent's name. The LumioGuard integration is optional and off by
  // default, and nothing may put its name on the page when it is off. The seal
  // stamps what the instrument is, which is this app's own name.
  wordmark: 'READOUT',
};
