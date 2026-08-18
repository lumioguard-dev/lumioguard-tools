/** Band names describe the OUTPUT, never the author. */
export const Tier = {
  HandCrafted: 'Hand-Crafted',
  LightlyTemplated: 'Lightly Templated',
  HeavilyTemplated: 'Heavily Templated',
  PureSlop: 'Pure Slop',
} as const;

export type Tier = (typeof Tier)[keyof typeof Tier];

export const SCORE_MIN = 0;
export const SCORE_MAX = 100;

export interface TierBand {
  readonly tier: Tier;
  readonly from: number;
  /** Inclusive. Unbounded on the last band so any score resolves. */
  readonly to: number;
  readonly description: string;
}

/** Ordered low to high; the first band whose ceiling is not exceeded wins. */
export const TIER_BANDS: readonly TierBand[] = Object.freeze([
  {
    tier: Tier.HandCrafted,
    from: 0,
    to: 19,
    description: 'Almost nothing here comes out of a box.',
  },
  {
    tier: Tier.LightlyTemplated,
    from: 20,
    to: 39,
    description: 'Mostly deliberate, leaning on a few defaults the crowd also uses.',
  },
  {
    tier: Tier.HeavilyTemplated,
    from: 40,
    to: 59,
    description: 'Untouched defaults across copy, layout and type.',
  },
  {
    tier: Tier.PureSlop,
    from: 60,
    to: Number.POSITIVE_INFINITY,
    description: 'Stock everything. The template is still showing.',
  },
]);

export const TIER_NAMES: readonly Tier[] = Object.freeze(TIER_BANDS.map((band) => band.tier));

export interface TrackSegment {
  readonly left: number;
  readonly width: number;
}

/** A band's place on the 0–100 track, as percentages. */
export function bandTrack(band: TierBand): TrackSegment {
  const width = Math.min(band.to + 1 - band.from, SCORE_MAX - band.from);
  return { left: band.from, width };
}
