import { describe, expect, it } from 'vitest';
import { SCORE_MAX, SCORE_MIN, TIER_BANDS, Tier, bandTrack } from '../tier.js';

describe('the tier ladder', () => {
  it('starts at the floor and leaves no gap between bands', () => {
    expect(TIER_BANDS[0]?.from).toBe(SCORE_MIN);
    for (let i = 1; i < TIER_BANDS.length; i += 1) {
      expect(TIER_BANDS[i]?.from).toBe((TIER_BANDS[i - 1]?.to ?? Number.NaN) + 1);
    }
  });

  // Higher is better: the ladder ends at the top of the scale, worst band first.
  it('runs from the worst band to the best, and ends at the top of the scale', () => {
    expect(TIER_BANDS[0]?.tier).toBe(Tier.Slop);
    expect(TIER_BANDS.at(-1)?.to).toBe(SCORE_MAX);
  });

  it('fills the track exactly once', () => {
    const segments = TIER_BANDS.map(bandTrack);
    expect(segments.reduce((sum, s) => sum + s.width, 0)).toBe(SCORE_MAX);
    for (let i = 1; i < segments.length; i += 1) {
      const previous = segments[i - 1];
      expect(segments[i]?.left).toBe((previous?.left ?? Number.NaN) + (previous?.width ?? 0));
    }
  });

  it('holds the thresholds the scoring is tuned against', () => {
    expect(TIER_BANDS.map((band) => [band.tier, band.from, band.to])).toEqual([
      [Tier.Slop, 0, 40],
      [Tier.HeavilyTemplated, 41, 60],
      [Tier.LightlyTemplated, 61, 80],
      [Tier.Crafted, 81, 100],
    ]);
  });
});
