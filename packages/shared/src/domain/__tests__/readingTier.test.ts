import { describe, expect, it } from 'vitest';
import { CITATION_BANDS } from '../citationTier.js';
import { EXPOSURE_BANDS } from '../exposureTier.js';
import {
  READING_BANDS,
  READING_MAX,
  ReadingTier,
  consolidatedScore,
  readingBandFor,
} from '../readingTier.js';
import { TIER_BANDS } from '../tier.js';

/** Geometry is covered for every ladder at once in `ladders.test.ts`. */
describe('the consolidated ladder', () => {
  // Higher is better, so the ends swap: below the scale is the worst band and
  // above it is the best.
  it('resolves a score from beyond either end of the scale', () => {
    expect(readingBandFor(-40).tier).toBe(ReadingTier.Critical);
    expect(readingBandFor(4000).tier).toBe(ReadingTier.Clean);
  });

  /**
   * The property the worst-of rests on. The consolidated score is always some
   * tool's own score, so if one ladder's boundaries moved, one number would sit
   * in two different bands depending on which panel it was read in.
   */
  it('has the same boundaries as every tool ladder it summarises', () => {
    const edges = (bands: readonly { from: number; to: number }[]): string =>
      bands.map((band) => `${band.from}-${band.to}`).join(' ');
    expect(edges(READING_BANDS)).toBe(edges(CITATION_BANDS));
    expect(edges(READING_BANDS)).toBe(edges(EXPOSURE_BANDS));
    expect(edges(READING_BANDS)).toBe(edges(TIER_BANDS));
  });
});

describe('the consolidated score', () => {
  it('is the worst of the readings, not a blend of them', () => {
    expect(consolidatedScore([82, 36, 78])).toBe(36);
  });

  /**
   * The reason it is not a mean. Adding a tool the site passes would otherwise
   * pay down a critical reading, improving the score with nothing fixed.
   */
  it('does not improve when a clean reading is added', () => {
    expect(consolidatedScore([36])).toBe(36);
    expect(consolidatedScore([36, 100, 100])).toBe(36);
  });

  it('claims nothing when nothing ran, rather than reading as a clean site', () => {
    expect(consolidatedScore([])).toBe(READING_MAX);
  });
});
