import { BAND_EDGES, type ScoreBand, type TrackSegment, bandOf, trackOf } from './band.js';

/** The one exposure ladder for Leakpeek. */
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
 * Ordered low to high; the first band whose ceiling is not exceeded wins.
 *
 * Typed as a NON-EMPTY list. `readonly ExposureBand[]` would let the ladder be
 * emptied without a compile error, and every lookup over it then has to answer
 * for a case that must never exist.
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
 * The ceiling of the worst band, and the score any critical finding is pinned DOWN to.
 *
 * A ceiling rather than a floor, because the scale runs higher-is-better: the
 * worst band is the bottom of the ladder now, and a critical pins a score down
 * into it rather than up.
 *
 * Derived from the band rather than written down beside it. This was once a
 * separate literal, so retuning the ladder moved the band and left the number
 * behind: the finding landed one band away from the tier the README promises it
 * pins, and nothing failed.
 */
export const EXPOSURE_CRITICAL_CEILING: number = WORST_EXPOSURE_BAND.to;

export const EXPOSURE_TIER_NAMES: readonly ExposureTier[] = Object.freeze(
  EXPOSURE_BANDS.map((band) => band.tier),
);

export type ExposureTrackSegment = TrackSegment;

/**
 * A band's place on the 0–100 track, as percentages. The top band is unbounded
 * but the track is not, so its width is clipped to what is left.
 */
export function exposureBandTrack(band: ExposureBand): ExposureTrackSegment {
  return trackOf(band, EXPOSURE_MAX);
}

/**
 * The band a score falls in: the first whose ceiling it does not exceed.
 *
 * Written to be total by construction rather than by assertion. The previous
 * shape fell out of the loop and asserted the last element back into existence,
 * which `noUncheckedIndexedAccess` had correctly typed as possibly absent: the
 * cast was load-bearing for compilation and a lie if the list were ever empty.
 * Carrying the last band seen needs no such claim.
 */
export function exposureBandFor(score: number): ExposureBand {
  return bandOf(EXPOSURE_BANDS, score, { min: EXPOSURE_MIN, max: EXPOSURE_MAX });
}
