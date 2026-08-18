import { describe, expect, it } from 'vitest';
import { SCORE_MAX, SCORE_MIN, TIER_BANDS, Tier, bandTrack } from '../tier.js';

describe('the tier ladder', () => {
  it('starts at the floor and leaves no gap between bands', () => {
    expect(TIER_BANDS[0]?.from).toBe(SCORE_MIN);
    for (let i = 1; i < TIER_BANDS.length; i += 1) {
      expect(TIER_BANDS[i]?.from).toBe((TIER_BANDS[i - 1]?.to ?? Number.NaN) + 1);
    }
  });

  it('resolves every score in range, and beyond it', () => {
    expect(TIER_BANDS.at(-1)?.to).toBe(Number.POSITIVE_INFINITY);
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
    expect(TIER_BANDS.map((band) => [band.tier, band.to])).toEqual([
      [Tier.HandCrafted, 19],
      [Tier.LightlyTemplated, 39],
      [Tier.HeavilyTemplated, 59],
      [Tier.PureSlop, Number.POSITIVE_INFINITY],
    ]);
  });
});
