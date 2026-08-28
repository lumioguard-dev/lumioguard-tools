import { describe, expect, it } from 'vitest';
import {
  CITATION_BANDS,
  CITATION_BLOCKING_CEILING,
  CitationTier,
  citationBandFor,
} from '../citationTier.js';

/** Geometry is covered for every ladder at once in `ladders.test.ts`. */
describe('the citation ladder', () => {
  it('runs from the worst band to the best, in this tool’s own words', () => {
    expect(CITATION_BANDS.map((band) => [band.tier, band.from, band.to])).toEqual([
      [CitationTier.Unreadable, 0, 40],
      [CitationTier.Obscured, 41, 60],
      [CitationTier.Patchy, 61, 80],
      [CitationTier.Legible, 81, 100],
    ]);
  });

  // Higher is better, so the ends swap: below the scale is the worst band and
  // above it is the best.
  it('resolves a score from beyond either end of the scale', () => {
    expect(citationBandFor(-40).tier).toBe(CitationTier.Unreadable);
    expect(citationBandFor(4000).tier).toBe(CitationTier.Legible);
  });

  /**
   * The pair the scorer relies on. Asserted against each other rather than
   * against a copy of the number: written as two literals they could be retuned
   * apart, and a blocker would land a band above the one the README promises.
   */
  it('pins a blocker finding down into the worst band', () => {
    expect(CITATION_BLOCKING_CEILING).toBe(CITATION_BANDS[0]?.to);
    expect(citationBandFor(CITATION_BLOCKING_CEILING).tier).toBe(CitationTier.Unreadable);
  });
});
