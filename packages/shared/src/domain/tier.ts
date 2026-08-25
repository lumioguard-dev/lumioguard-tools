import { BAND_EDGES, type ScoreBand, type TrackSegment, trackOf } from './band.js';

/** Band names describe the OUTPUT, never the author. */
export const Tier = {
  Crafted: 'Crafted',
  LightlyTemplated: 'Lightly Templated',
  HeavilyTemplated: 'Heavily Templated',
  Slop: 'Slop',
} as const;

export type Tier = (typeof Tier)[keyof typeof Tier];

export const SCORE_MIN = 0;
export const SCORE_MAX = 100;

export interface TierBand extends ScoreBand {
  readonly tier: Tier;
}

/** Ordered low to high; the first band whose ceiling is not exceeded wins. */
export const TIER_BANDS: readonly TierBand[] = Object.freeze([
  {
    tier: Tier.Slop,
    ...BAND_EDGES[0],
    description: 'Stock everything. The template is still showing.',
  },
  {
    tier: Tier.HeavilyTemplated,
    ...BAND_EDGES[1],
    description: 'Untouched defaults across copy, layout and type.',
  },
  {
    tier: Tier.LightlyTemplated,
    ...BAND_EDGES[2],
    description: 'Mostly deliberate, leaning on a few defaults the crowd also uses.',
  },
  {
    tier: Tier.Crafted,
    ...BAND_EDGES[3],
    description: 'Almost nothing here comes out of a box.',
  },
]);

export const TIER_NAMES: readonly Tier[] = Object.freeze(TIER_BANDS.map((band) => band.tier));

export type { TrackSegment };

/** A band's place on the 0–100 track, as percentages. */
export function bandTrack(band: TierBand): TrackSegment {
  return trackOf(band, SCORE_MAX);
}
