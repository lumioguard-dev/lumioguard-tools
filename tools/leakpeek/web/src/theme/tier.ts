import { band, ink, red, state } from '@lumioguard/design-tokens';
import {
  EXPOSURE_BANDS,
  EXPOSURE_MAX,
  type ExposureBand,
  type ExposureTier,
  type ExposureTrackSegment,
  type Severity,
  exposureBandTrack,
} from '@lumioguard/shared';
import type { VerdictScale } from '@lumioguard/ui';

/**
 * ExposureTier is a Leakpeek concept; the token package stays free of any
 * one tool's vocabulary, so the mapping lives here.
 */
const TIER_INK: Record<ExposureTier, string> = {
  Sealed: band.calm,
  Exposed: band.notice,
  Cracked: band.warn,
  'Wide Open': band.alarm,
};

export function tierInk(tier: ExposureTier): string {
  return TIER_INK[tier];
}

export interface InkedBand extends ExposureBand {
  readonly ink: string;
  readonly track: ExposureTrackSegment;
}

/** The shared ladder, with the one thing the surface adds to it. */
export const BANDS: readonly InkedBand[] = EXPOSURE_BANDS.map((exposureBand) => ({
  ...exposureBand,
  ink: TIER_INK[exposureBand.tier],
  track: exposureBandTrack(exposureBand),
}));

/** Severity → ink, so a critical does not read the same as a low. */
const SEVERITY_INK: Record<Severity, string> = {
  critical: red[400],
  high: red[300],
  medium: ink[2],
  low: state.success.fg,
};

export function severityInk(severity: Severity): string {
  return SEVERITY_INK[severity];
}
/** The instrument's configuration: what varies about drawing an exposure verdict. */
export const VERDICT_SCALE: VerdictScale = {
  bands: BANDS,
  max: EXPOSURE_MAX,
  inkFor: (tier) => tierInk(tier as ExposureTier),
  wordmark: 'LEAKPEEK',
};
