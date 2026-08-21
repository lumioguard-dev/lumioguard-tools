import { describe, expect, it } from 'vitest';
import {
  CITATION_BANDS,
  CITATION_BLOCKING_CEILING,
  CITATION_MAX,
  CITATION_MIN,
  CitationTier,
  citationBandFor,
  citationBandTrack,
} from '../citationTier.js';

describe('the citation ladder', () => {
  it('starts at the floor and leaves no gap between bands', () => {
    expect(CITATION_BANDS[0]?.from).toBe(CITATION_MIN);
    for (let i = 1; i < CITATION_BANDS.length; i += 1) {
      expect(CITATION_BANDS[i]?.from).toBe((CITATION_BANDS[i - 1]?.to ?? Number.NaN) + 1);
    }
  });

  // Higher is better, so the ends swap: below the scale is the worst band and
  // above it is the best.
  it('resolves every score in range, and beyond it', () => {
    expect(CITATION_BANDS.at(-1)?.to).toBe(CITATION_MAX);
    expect(citationBandFor(-40).tier).toBe(CitationTier.Unreadable);
    expect(citationBandFor(4000).tier).toBe(CitationTier.Legible);
  });

  it('fills the track exactly once', () => {
    const segments = CITATION_BANDS.map(citationBandTrack);
    expect(segments.reduce((sum, s) => sum + s.width, 0)).toBe(CITATION_MAX);
    for (let i = 1; i < segments.length; i += 1) {
      const previous = segments[i - 1];
      expect(segments[i]?.left).toBe((previous?.left ?? Number.NaN) + (previous?.width ?? 0));
    }
  });

  it('holds the thresholds the scoring is tuned against', () => {
    expect(CITATION_BANDS.map((band) => [band.tier, band.from, band.to])).toEqual([
      [CitationTier.Unreadable, 0, 40],
      [CitationTier.Obscured, 41, 60],
      [CitationTier.Patchy, 61, 80],
      [CitationTier.Legible, 81, 100],
    ]);
  });

  /**
   * The pair the scorer relies on. Asserted against each other rather than
   * against a copy of 40: written as two literals they could be retuned apart,
   * and a blocker finding would land a band above the one the README promises.
   */
  it('pins a blocker finding down into the worst band', () => {
    expect(CITATION_BLOCKING_CEILING).toBe(CITATION_BANDS[0]?.to);
    expect(citationBandFor(CITATION_BLOCKING_CEILING).tier).toBe(CitationTier.Unreadable);
  });
});
