import { describe, expect, it } from 'vitest';
import { TIER_BANDS, Tier } from '../tier.js';

/** Geometry is covered for every ladder at once in `ladders.test.ts`. */
describe('the tier ladder', () => {
  it('runs from the worst band to the best, in this tool’s own words', () => {
    expect(TIER_BANDS.map((band) => [band.tier, band.from, band.to])).toEqual([
      [Tier.Slop, 0, 40],
      [Tier.HeavilyTemplated, 41, 60],
      [Tier.LightlyTemplated, 61, 80],
      [Tier.Handmade, 81, 100],
    ]);
  });
});
