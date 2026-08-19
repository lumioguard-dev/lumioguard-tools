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

export interface ExposureBand {
  readonly tier: ExposureTier;
  readonly from: number;
  /** Inclusive. Unbounded on the last band so any score resolves. */
  readonly to: number;
  readonly description: string;
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
    tier: ExposureTier.Sealed,
    from: 0,
    to: 19,
    description: 'Nothing obvious is leaking from the browser.',
  },
  {
    tier: ExposureTier.Exposed,
    from: 20,
    to: 39,
    description: 'A secret or a misconfiguration is visible in what the site ships.',
  },
  {
    tier: ExposureTier.Cracked,
    from: 40,
    to: 59,
    description: 'Readable data or a live key. Fixable today, dangerous until it is.',
  },
  {
    tier: ExposureTier.WideOpen,
    from: 60,
    to: Number.POSITIVE_INFINITY,
    description: "Anyone with the URL can read this app's data right now.",
  },
]);

/** Defined because the list above is typed non-empty, not because it is asserted. */
const FIRST_EXPOSURE_BAND: ExposureBand = EXPOSURE_BANDS[0];

/** `reduce` with no seed over a non-empty list: the last band, no assertion. */
const TOP_EXPOSURE_BAND: ExposureBand = EXPOSURE_BANDS.reduce((_, band) => band);

/**
 * The floor of the top band, and the score any critical finding is pinned to.
 *
 * Derived rather than written down twice. The scorer used to carry its own `60`
 * beside this band's `from: 60`, so retuning the ladder moved the band and left
 * the floor behind: a critical would have landed one band below the tier the
 * README promises it pins, and nothing would have failed.
 */
export const EXPOSURE_CRITICAL_FLOOR: number = TOP_EXPOSURE_BAND.from;

export const EXPOSURE_TIER_NAMES: readonly ExposureTier[] = Object.freeze(
  EXPOSURE_BANDS.map((band) => band.tier),
);

export interface ExposureTrackSegment {
  readonly left: number;
  readonly width: number;
}

/**
 * A band's place on the 0–100 track, as percentages. The top band is unbounded
 * but the track is not, so its width is clipped to what is left.
 */
export function exposureBandTrack(band: ExposureBand): ExposureTrackSegment {
  const width = Math.min(band.to + 1 - band.from, EXPOSURE_MAX - band.from);
  return { left: band.from, width };
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
  const clamped = Math.max(EXPOSURE_MIN, Math.min(EXPOSURE_MAX, score));
  let match = FIRST_EXPOSURE_BAND;
  for (const band of EXPOSURE_BANDS) {
    match = band;
    if (clamped <= band.to) break;
  }
  return match;
}
