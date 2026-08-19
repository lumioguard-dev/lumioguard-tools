import { EXPOSURE_BANDS, EXPOSURE_MAX, EXPOSURE_MIN } from '@lumioguard/shared';
import { describe, expect, it } from 'vitest';
import { BANDS, VERDICT_SCALE, severityInk, tierInk } from '../tier.js';

/**
 * What the surface adds to the shared ladder: a colour per band and a segment
 * of the track. The ladder itself is proven in `shared`; these are the parts
 * that only exist once a verdict is drawn.
 */

describe('BANDS', () => {
  it('carries every band the shared ladder defines, in order', () => {
    expect(BANDS.map((b) => b.tier)).toEqual(EXPOSURE_BANDS.map((b) => b.tier));
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
});

describe('VERDICT_SCALE', () => {
  it('tops out at the exposure scale, so the needle is clamped to the right place', () => {
    expect(VERDICT_SCALE.max).toBe(EXPOSURE_MAX);
  });

  it('is struck with this tool’s wordmark', () => {
    expect(VERDICT_SCALE.wordmark).toBe('LEAKPEEK');
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
   */
  it.each(['Likely Generated', '', 'wide open', 'WIDE OPEN', 'Sealed '])(
    'still returns a usable colour for the unknown tier %j',
    (tier) => {
      const result = VERDICT_SCALE.inkFor(tier);
      expect(result).toBeTruthy();
      expect(result).not.toContain('undefined');
    },
  );
});

describe('tierInk and severityInk', () => {
  it('inks all four tiers distinctly', () => {
    const inks = EXPOSURE_BANDS.map((b) => tierInk(b.tier));
    expect(inks.every(Boolean)).toBe(true);
    expect(new Set(inks).size).toBe(inks.length);
  });

  // A critical that reads like a low is the failure that matters here.
  it('does not let a critical look like a low', () => {
    expect(severityInk('critical')).not.toBe(severityInk('low'));
    expect(severityInk('critical')).not.toBe(severityInk('medium'));
  });

  it('inks every severity with something', () => {
    for (const severity of ['critical', 'high', 'medium', 'low'] as const) {
      expect(severityInk(severity), severity).toBeTruthy();
    }
  });
});

describe('the ladder it draws', () => {
  it('starts at the floor of the scale', () => {
    expect(BANDS[0]?.from).toBe(EXPOSURE_MIN);
  });
});
