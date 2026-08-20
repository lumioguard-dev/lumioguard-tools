import { CITATION_BANDS, CITATION_MAX, CITATION_MIN } from '@lumioguard/shared';
import { describe, expect, it } from 'vitest';
import { BANDS, VERDICT_SCALE, accessInk, impactInk, tierInk } from '../theme.js';

/**
 * What the surface adds to the shared ladder: a colour per band and a segment
 * of the track. The ladder itself is proven in `shared`; these are the parts
 * that only exist once a verdict is drawn.
 */

describe('BANDS', () => {
  it('carries every band the shared ladder defines, in order', () => {
    expect(BANDS.map((b) => b.tier)).toEqual(CITATION_BANDS.map((b) => b.tier));
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
    expect(BANDS[0]?.from).toBe(CITATION_MIN);
  });
});

describe('VERDICT_SCALE', () => {
  it('tops out at the citation scale, so the needle is clamped to the right place', () => {
    expect(VERDICT_SCALE.max).toBe(CITATION_MAX);
  });

  it('is struck with this tool’s wordmark', () => {
    expect(VERDICT_SCALE.wordmark).toBe('CITECHECK');
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
  it.each(['Wide Open', '', 'legible', 'LEGIBLE', 'Patchy '])(
    'still returns a usable colour for the unknown tier %j',
    (tier) => {
      const result = VERDICT_SCALE.inkFor(tier);
      expect(result).toBeTruthy();
      expect(result).not.toContain('undefined');
    },
  );
});

describe('tierInk and impactInk', () => {
  it('inks all four tiers distinctly', () => {
    const inks = CITATION_BANDS.map((b) => tierInk(b.tier));
    expect(inks.every(Boolean)).toBe(true);
    expect(new Set(inks).size).toBe(inks.length);
  });

  // A blocker finding that reads like a minor one is the failure that matters.
  it('does not let a blocker finding look like a minor one', () => {
    expect(impactInk('blocker')).not.toBe(impactInk('minor'));
    expect(impactInk('blocker')).not.toBe(impactInk('major'));
  });

  it('inks every impact with something', () => {
    for (const impact of ['blocker', 'major', 'minor'] as const) {
      expect(impactInk(impact), impact).toBeTruthy();
    }
  });
});

describe('accessInk', () => {
  /**
   * The surface must not pass the judgement the engine deliberately refuses to.
   * Blocking a crawler is a choice, so `blocked` may not be drawn in the same
   * ink as the worst tier: red would make the panel read as a fault list.
   */
  it('does not paint a blocked crawler as an alarm', () => {
    const worstBand = BANDS.at(-1);
    expect(accessInk('blocked')).not.toBe(worstBand?.ink);
  });

  it('tells the three states apart', () => {
    const inks = (['allowed', 'blocked', 'unmentioned'] as const).map(accessInk);
    expect(inks.every(Boolean)).toBe(true);
    expect(new Set(inks).size).toBe(inks.length);
  });
});
