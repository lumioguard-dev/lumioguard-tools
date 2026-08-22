import { BAND_EDGES, type ScoreBand, type TrackSegment, bandOf, trackOf } from './band.js';

/**
 * The one citation ladder. Bands name HOW MUCH OF THE PAGE A MACHINE GETS, the
 * only thing observable here, never quality and never effort. Two earlier sets
 * were retired for claiming more; the README records them.
 */
export const CitationTier = {
  Legible: 'Legible',
  Patchy: 'Patchy',
  Obscured: 'Obscured',
  Unreadable: 'Unreadable',
} as const;

export type CitationTier = (typeof CitationTier)[keyof typeof CitationTier];

export const CITATION_MIN = 0;
export const CITATION_MAX = 100;

export interface CitationBand extends ScoreBand {
  readonly tier: CitationTier;
}

/**
 * Ordered low to high; the first band whose ceiling is not exceeded wins.
 *
 * Typed as a NON-EMPTY list, for the reason exposureTier.ts gives: a plain
 * `readonly CitationBand[]` would let the ladder be emptied without a compile
 * error, and every lookup over it then has to answer for a case that must
 * never exist.
 */
export const CITATION_BANDS: readonly [CitationBand, ...CitationBand[]] = Object.freeze([
  {
    tier: CitationTier.Unreadable,
    ...BAND_EDGES[0],
    description: 'A machine gets nothing it can use from this page.',
  },
  {
    tier: CitationTier.Obscured,
    ...BAND_EDGES[1],
    description: 'A machine gets fragments, and infers the rest of the page for itself.',
  },
  {
    tier: CitationTier.Patchy,
    ...BAND_EDGES[2],
    description: 'A machine gets most of the page and works around the rest.',
  },
  {
    tier: CitationTier.Legible,
    ...BAND_EDGES[3],
    description: 'A machine reading this page gets the whole of it.',
  },
]);

/** `bands[0]` over a non-empty list: the worst band, no assertion. */
const WORST_CITATION_BAND: CitationBand = CITATION_BANDS[0];

/**
 * The ceiling of the worst band, and the score any blocking finding is pinned DOWN to.
 *
 * A ceiling rather than a floor, because the scale runs higher-is-better: the
 * worst band is the bottom of the ladder now, and a blocker pins a score down
 * into it rather than up.
 *
 * Derived from the band rather than written down beside it. This was once a
 * separate literal, so retuning the ladder moved the band and left the number
 * behind: the finding landed one band away from the tier the README promises it
 * pins, and nothing failed.
 */
export const CITATION_BLOCKING_CEILING: number = WORST_CITATION_BAND.to;

export const CITATION_TIER_NAMES: readonly CitationTier[] = Object.freeze(
  CITATION_BANDS.map((band) => band.tier),
);

export type CitationTrackSegment = TrackSegment;

/**
 * A band's place on the 0-100 track, as percentages. The top band is unbounded
 * but the track is not, so its width is clipped to what is left.
 */
export function citationBandTrack(band: CitationBand): CitationTrackSegment {
  return trackOf(band, CITATION_MAX);
}

/** The band a score falls in: the first whose ceiling it does not exceed. */
export function citationBandFor(score: number): CitationBand {
  return bandOf(CITATION_BANDS, score, { min: CITATION_MIN, max: CITATION_MAX });
}
