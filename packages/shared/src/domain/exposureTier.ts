import { BAND_EDGES, type ScoreBand, type TrackSegment, bandOf } from './band.js';

export const ExposureTier = {
  Sealed: 'Sealed',
  Exposed: 'Exposed',
  Cracked: 'Cracked',
  WideOpen: 'Wide Open',
} as const;

export type ExposureTier = (typeof ExposureTier)[keyof typeof ExposureTier];

export const EXPOSURE_MIN = 0;
export const EXPOSURE_MAX = 100;

export interface ExposureBand extends ScoreBand {
  readonly tier: ExposureTier;
}

/**
 * Ordered low to high; the first band whose ceiling is not exceeded wins. Typed
 * as a NON-EMPTY list: `readonly ExposureBand[]` would let the ladder be emptied
 * without a compile error, leaving every lookup to answer for an impossible case.
 */
export const EXPOSURE_BANDS: readonly [ExposureBand, ...ExposureBand[]] = Object.freeze([
  {
    tier: ExposureTier.WideOpen,
    ...BAND_EDGES[0],
    description: "Anyone with the URL can read this app's data right now.",
  },
  {
    tier: ExposureTier.Cracked,
    ...BAND_EDGES[1],
    description: 'Readable data or a live key. Fixable today, dangerous until it is.',
  },
  {
    tier: ExposureTier.Exposed,
    ...BAND_EDGES[2],
    description: 'A secret or a misconfiguration is visible in what the site ships.',
  },
  {
    tier: ExposureTier.Sealed,
    ...BAND_EDGES[3],
    description: 'Nothing obvious is leaking from the browser.',
  },
]);

/** `bands[0]` over a non-empty list: the worst band, no assertion. */
const WORST_EXPOSURE_BAND: ExposureBand = EXPOSURE_BANDS[0];

/**
 * The ceiling of the worst band, and the score any critical finding is pinned
 * DOWN to. Derived from the band, never written beside it: as a separate literal
 * a retuned ladder left it behind, pinning a band off from what the README promises.
 */
export const EXPOSURE_CRITICAL_CEILING: number = WORST_EXPOSURE_BAND.to;

export const EXPOSURE_TIER_NAMES: readonly ExposureTier[] = Object.freeze(
  EXPOSURE_BANDS.map((band) => band.tier),
);

export type ExposureTrackSegment = TrackSegment;

/** The band a score falls in: the first whose ceiling it does not exceed. */
export function exposureBandFor(score: number): ExposureBand {
  return bandOf(EXPOSURE_BANDS, score, { min: EXPOSURE_MIN, max: EXPOSURE_MAX });
}
