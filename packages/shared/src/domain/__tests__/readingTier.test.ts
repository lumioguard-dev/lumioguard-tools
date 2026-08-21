import { describe, expect, it } from 'vitest';
import { CITATION_BANDS } from '../citationTier.js';
import { EXPOSURE_BANDS } from '../exposureTier.js';
import {
  READING_BANDS,
  READING_MAX,
  READING_MIN,
  ReadingTier,
  consolidatedScore,
  readingBandFor,
  readingBandTrack,
} from '../readingTier.js';
import { TIER_BANDS } from '../tier.js';

describe('the consolidated ladder', () => {
  it('starts at the floor and leaves no gap between bands', () => {
    expect(READING_BANDS[0]?.from).toBe(READING_MIN);
    for (let i = 1; i < READING_BANDS.length; i += 1) {
      expect(READING_BANDS[i]?.from).toBe((READING_BANDS[i - 1]?.to ?? Number.NaN) + 1);
    }
  });

  // Higher is better, so the ends swap: below the scale is the worst band and
  // above it is the best.
  it('resolves every score in range, and beyond it', () => {
    expect(READING_BANDS.at(-1)?.to).toBe(READING_MAX);
    expect(readingBandFor(-40).tier).toBe(ReadingTier.Critical);
    expect(readingBandFor(4000).tier).toBe(ReadingTier.Clean);
  });

  it('fills the track exactly once', () => {
    const segments = READING_BANDS.map(readingBandTrack);
    expect(segments.reduce((sum, segment) => sum + segment.width, 0)).toBe(READING_MAX);
    for (let i = 1; i < segments.length; i += 1) {
      const previous = segments[i - 1];
      expect(segments[i]?.left).toBe((previous?.left ?? Number.NaN) + (previous?.width ?? 0));
    }
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
