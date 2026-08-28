import { band, ink, red, state } from '@lumioguard/design-tokens';
import { CITATION_BANDS, CITATION_MAX, type CitationTier, type Impact } from '@lumioguard/shared';
import type { AgentAccess } from '@lumioguard/shared';
import { type InkedBand, type VerdictScale, inkedBands, verdictScale } from '@lumioguard/ui';

/** CitationTier is Citecheck's vocabulary, which the token package stays free of. */
const TIER_INK: Record<CitationTier, string> = {
  Legible: band.calm,
  Patchy: band.notice,
  Obscured: band.warn,
  Unreadable: band.alarm,
};

export function tierInk(tier: CitationTier): string {
  return TIER_INK[tier];
}

export const BANDS: readonly InkedBand[] = inkedBands(CITATION_BANDS, CITATION_MAX, tierInk);

/** Impact to ink, so a blocker does not read the same as a minor finding. */
const IMPACT_INK: Record<Impact, string> = {
  blocker: red[400],
  major: red[300],
  minor: ink[2],
  // Never red: an absence costs nothing and is not a fault.
  absent: ink[3],
};

export function impactInk(impact: Impact): string {
  return IMPACT_INK[impact];
}

/**
 * `blocked` is NOT an alarm. Blocking a crawler is a choice the site is entitled to
 * make, and red would be the surface passing a judgement the engine refuses to.
 */
const ACCESS_INK: Record<AgentAccess, string> = {
  allowed: state.success.fg,
  blocked: band.notice,
  unmentioned: ink[3],
};

export function accessInk(access: AgentAccess): string {
  return ACCESS_INK[access];
}

export const VERDICT_SCALE: VerdictScale = verdictScale(BANDS, CITATION_MAX);
