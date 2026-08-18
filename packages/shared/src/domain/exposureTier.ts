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

/** Ordered low to high; the first band whose ceiling is not exceeded wins. */
export const EXPOSURE_BANDS: readonly ExposureBand[] = Object.freeze([
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

/** The band a score falls in — the first whose ceiling it does not exceed. */
export function exposureBandFor(score: number): ExposureBand {
  const clamped = Math.max(EXPOSURE_MIN, Math.min(EXPOSURE_MAX, score));
  for (const band of EXPOSURE_BANDS) {
    if (clamped <= band.to) return band;
  }
  // Unreachable: the last band is unbounded. Present so the return type is total.
  return EXPOSURE_BANDS[EXPOSURE_BANDS.length - 1] as ExposureBand;
}
