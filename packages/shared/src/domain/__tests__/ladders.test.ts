import { describe, expect, it } from 'vitest';
import { type ScoreBand, trackOf } from '../band.js';
import { CITATION_BANDS, CITATION_MAX, CITATION_MIN } from '../citationTier.js';
import { EXPOSURE_BANDS, EXPOSURE_MAX, EXPOSURE_MIN } from '../exposureTier.js';
import { READING_BANDS, READING_MAX, READING_MIN } from '../readingTier.js';
import { SCORE_MAX, SCORE_MIN, TIER_BANDS } from '../tier.js';

/**
 * One table, not one suite per ladder: written per ladder the copies drifted, and
 * the exposure ladder, the one carrying a ceiling, was never given a suite at all.
 */
const LADDERS: readonly {
  readonly name: string;
  readonly bands: readonly ScoreBand[];
  readonly min: number;
  readonly max: number;
}[] = [
  { name: 'slop', bands: TIER_BANDS, min: SCORE_MIN, max: SCORE_MAX },
  { name: 'exposure', bands: EXPOSURE_BANDS, min: EXPOSURE_MIN, max: EXPOSURE_MAX },
  { name: 'citation', bands: CITATION_BANDS, min: CITATION_MIN, max: CITATION_MAX },
  { name: 'consolidated', bands: READING_BANDS, min: READING_MIN, max: READING_MAX },
];

describe.each(LADDERS)('the $name ladder', ({ bands, min, max }) => {
  it('starts at the floor and leaves no gap between bands', () => {
    expect(bands[0]?.from).toBe(min);
    for (let i = 1; i < bands.length; i += 1) {
      expect(bands[i]?.from).toBe((bands[i - 1]?.to ?? Number.NaN) + 1);
    }
  });

  /** Higher is better, so the ladder runs worst band first and ends at the top. */
  it('ends at the top of the scale', () => {
    expect(bands.at(-1)?.to).toBe(max);
  });

  it('fills the track exactly once', () => {
    const segments = bands.map((band) => trackOf(band, max));
    expect(segments.reduce((sum, segment) => sum + segment.width, 0)).toBe(max);
    for (let i = 1; i < segments.length; i += 1) {
      const previous = segments[i - 1];
      expect(segments[i]?.left).toBe((previous?.left ?? Number.NaN) + (previous?.width ?? 0));
    }
  });

  /** The thresholds every engine is tuned against, and the worst-of rests on. */
  it('holds the thresholds the scoring is tuned against', () => {
    expect(bands.map((band) => [band.from, band.to])).toEqual([
      [0, 40],
      [41, 60],
      [61, 80],
      [81, 100],
    ]);
  });
});
