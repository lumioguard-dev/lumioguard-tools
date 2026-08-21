import { band, ink, red, state } from '@lumioguard/design-tokens';
import {
  CITATION_BANDS,
  CITATION_MAX,
  type CitationBand,
  type CitationTier,
  type CitationTrackSegment,
  type Impact,
  citationBandTrack,
} from '@lumioguard/shared';
import type { AgentAccess } from '@lumioguard/shared';
import type { VerdictScale } from '@lumioguard/ui';

/**
 * CitationTier is a Citecheck concept; the token package stays free of any one
 * tool's vocabulary, so the mapping lives here.
 */
const TIER_INK: Record<CitationTier, string> = {
  Legible: band.calm,
  Patchy: band.notice,
  Obscured: band.warn,
  Unreadable: band.alarm,
};

export function tierInk(tier: CitationTier): string {
  return TIER_INK[tier];
}

export interface InkedBand extends CitationBand {
  readonly ink: string;
  readonly track: CitationTrackSegment;
}

/** The shared ladder, with the one thing the surface adds to it. */
export const BANDS: readonly InkedBand[] = CITATION_BANDS.map((citationBand) => ({
  ...citationBand,
  ink: TIER_INK[citationBand.tier],
  track: citationBandTrack(citationBand),
}));

/** Impact to ink, so a blocker does not read the same as a minor finding. */
const IMPACT_INK: Record<Impact, string> = {
  blocker: red[400],
  major: red[300],
  minor: ink[2],
  // Never red. An absence costs nothing and is not a fault, and colouring it
  // like one would have the surface pass a judgement the engine refuses to.
  absent: ink[3],
};

export function impactInk(impact: Impact): string {
  return IMPACT_INK[impact];
}

/**
 * Access to ink.
 *
 * `blocked` is NOT drawn as an alarm. Blocking a crawler is a choice the site
 * is entitled to make, and painting it red would be the surface passing a
 * judgement the engine deliberately refuses to score. It is a state, not a
 * fault, so it takes the neutral notice ink and `allowed` takes the positive.
 */
const ACCESS_INK: Record<AgentAccess, string> = {
  allowed: state.success.fg,
  blocked: band.notice,
  unmentioned: ink[3],
};

export function accessInk(access: AgentAccess): string {
  return ACCESS_INK[access];
}

/**
 * The instrument's configuration: what varies about drawing a citation verdict.
 *
 * `inkFor` takes a plain string, because the component draws every tool's ladder
 * and knows none of their vocabularies. Looked up rather than asserted: casting
 * the string to a CitationTier would hand `TIER_INK` a key it may not have, and
 * the miss is `undefined`, which reaches an inline style and paints the seal
 * with no colour at all, on the one element the whole report is built around.
 */
export const VERDICT_SCALE: VerdictScale = {
  bands: BANDS,
  max: CITATION_MAX,
  inkFor: (tier) => BANDS.find((candidate) => candidate.tier === tier)?.ink ?? ink[2],
  wordmark: 'CITECHECK',
};
