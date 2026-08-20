import { SCORE_MAX, SCORE_MIN, TIER_BANDS } from '@lumioguard/shared';
import { describe, expect, it } from 'vitest';
import { BANDS, VERDICT_SCALE, tierInk } from '../theme.js';

/**
 * What the surface adds to the shared ladder: a colour per band and a segment
 * of the track. The ladder itself is proven in `shared`; these are the parts
 * that only exist once a verdict is drawn.
 */

describe('BANDS', () => {
  it('carries every band the shared ladder defines, in order', () => {
    expect(BANDS.map((b) => b.tier)).toEqual(TIER_BANDS.map((b) => b.tier));
  });

  it('gives each band an ink', () => {
    for (const band of BANDS) {
      expect(band.ink, `${band.tier} has no ink`).toBeTruthy();
    }
  });

  // Two bands sharing a colour makes the verdict unreadable: the seal and the
  // needle would say different things about the same score.
  it('gives each band a DIFFERENT ink', () => {
    expect(new Set(BANDS.map((b) => b.ink)).size).toBe(BANDS.length);
  });

  it('lays the track out left to right without gaps or overlap', () => {
    let expectedLeft = 0;
    for (const band of BANDS) {
      expect(band.track.left).toBeCloseTo(expectedLeft, 5);
      expect(band.track.width).toBeGreaterThan(0);
      expectedLeft += band.track.width;
    }
    expect(expectedLeft).toBeCloseTo(100, 5);
  });

  it('starts at the floor of the scale', () => {
    expect(BANDS[0]?.from).toBe(SCORE_MIN);
  });
});

describe('VERDICT_SCALE', () => {
  it('tops out at the score scale, so the needle is clamped to the right place', () => {
    expect(VERDICT_SCALE.max).toBe(SCORE_MAX);
  });

  it('is struck with this tool’s wordmark', () => {
    expect(VERDICT_SCALE.wordmark).toBe('SLOPMETER');
  });

  it('inks every real tier the same way the band does', () => {
    for (const band of BANDS) {
      expect(VERDICT_SCALE.inkFor(band.tier)).toBe(band.ink);
    }
  });

  /**
   * The reason `inkFor` looks the tier up rather than casting the string it is
   * given. A cast hands the lookup a key it may not have, and the miss is
   * `undefined`, which reaches an inline style and paints the seal with no
   * colour: on the one element the whole report is built around.
   *
   * "Likely Generated" is not a hypothetical: it is a band name this ladder
   * used to carry, and it was renamed because it asserted authorship the
   * instrument cannot determine.
   */
  it.each(['Likely Generated', 'Suspiciously Clean', '', 'pure slop', 'PURE SLOP'])(
    'still returns a usable colour for the unknown tier %j',
    (tier) => {
      const result = VERDICT_SCALE.inkFor(tier);
      expect(result).toBeTruthy();
      expect(result).not.toContain('undefined');
    },
  );
});

describe('tierInk', () => {
  it('inks all four tiers distinctly', () => {
    const inks = TIER_BANDS.map((b) => tierInk(b.tier));
    expect(inks.every(Boolean)).toBe(true);
    expect(new Set(inks).size).toBe(inks.length);
  });
});
