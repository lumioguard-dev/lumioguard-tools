import { band, ink, red, state } from '@lumioguard/design-tokens';
import { EXPOSURE_BANDS, EXPOSURE_MAX, type ExposureTier, type Severity } from '@lumioguard/shared';
import { type InkedBand, type VerdictScale, inkedBands, verdictScale } from '@lumioguard/ui';

/** ExposureTier is Leakpeek's vocabulary, which the token package stays free of. */
const TIER_INK: Record<ExposureTier, string> = {
  Sealed: band.calm,
  Exposed: band.notice,
  Cracked: band.warn,
  'Wide Open': band.alarm,
};

export function tierInk(tier: ExposureTier): string {
  return TIER_INK[tier];
}

export const BANDS: readonly InkedBand[] = inkedBands(EXPOSURE_BANDS, EXPOSURE_MAX, tierInk);

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
export const VERDICT_SCALE: VerdictScale = verdictScale(BANDS, EXPOSURE_MAX);
