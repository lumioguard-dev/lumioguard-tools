import { BAND_EDGES, type ScoreBand, bandOf } from './band.js';

/**
 * The one verdict a multi-tool reading lands on. Named for the SITE's standing,
 * not for any one tool's subject: no word from Slopmeter, Leakpeek or Citecheck
 * describes the other two. Which reading said so is named separately.
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
 * WORST of the readings rather than a blend: it is always some tool's own score,
 * and a ladder that did not line up would band one number two different ways.
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
