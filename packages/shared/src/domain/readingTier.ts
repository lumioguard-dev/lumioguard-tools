import { BAND_EDGES, type ScoreBand, type TrackSegment, bandOf, trackOf } from './band.js';

/**
 * The one verdict a multi-tool reading lands on.
 *
 * Named for the SITE's standing, not for any one tool's subject: Slopmeter
 * grades a template, Leakpeek an exposure and Citecheck a page's legibility,
 * and no word from any of those three describes the other two. These four say
 * how much is wrong across whatever was run, and nothing about which reading
 * said so. The report names that separately, in that tool's own words.
 */
export const ReadingTier = {
  Clean: 'Clean',
  Marked: 'Marked',
  Serious: 'Serious',
  Critical: 'Critical',
} as const;

export type ReadingTier = (typeof ReadingTier)[keyof typeof ReadingTier];

export const READING_MIN = 0;
export const READING_MAX = 100;

export interface ReadingBand extends ScoreBand {
  readonly tier: ReadingTier;
}

/**
 * The same four bands every tool uses, because the consolidated score is the
 * WORST of the readings rather than a blend of them: it is always some tool's
 * own score, so a ladder that did not line up with theirs would put one number
 * in two different bands depending on which panel you read it in.
 */
export const READING_BANDS: readonly [ReadingBand, ...ReadingBand[]] = Object.freeze([
  {
    tier: ReadingTier.Critical,
    ...BAND_EDGES[0],
    description: 'At least one reading found something to fix before anything else.',
  },
  {
    tier: ReadingTier.Serious,
    ...BAND_EDGES[1],
    description: 'At least one reading found something costing this site now.',
  },
  {
    tier: ReadingTier.Marked,
    ...BAND_EDGES[2],
    description: 'One reading found something worth attending to. None of it is urgent.',
  },
  {
    tier: ReadingTier.Clean,
    ...BAND_EDGES[3],
    description: 'Nothing any of these readings found is standing in the way.',
  },
]);

export const READING_TIER_NAMES: readonly ReadingTier[] = Object.freeze(
  READING_BANDS.map((band) => band.tier),
);

export function readingBandTrack(band: ReadingBand): TrackSegment {
  return trackOf(band, READING_MAX);
}

export function readingBandFor(score: number): ReadingBand {
  return bandOf(READING_BANDS, score, { min: READING_MIN, max: READING_MAX });
}

/**
 * The consolidated score: the WORST of the readings, never a mean. An average
 * lets a clean reading pay down a critical one, and adding a tool the site
 * passes would raise the score with nothing fixed. Bottom of scale when empty.
 */
export function consolidatedScore(scores: readonly number[]): number {
  return scores.reduce((worst, score) => Math.min(worst, score), READING_MAX);
}
