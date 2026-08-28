import { CITATION_BANDS } from '@lumioguard/shared';
import { describe, expect, it } from 'vitest';
import { BANDS, accessInk, impactInk, tierInk } from '../theme.js';

// The ladder, the track and the unknown-tier fallback are proven for every tool at
// once in `src/tools/__tests__/theme.test.ts`. Only this reading's own is left here.

describe('citecheck inks', () => {
  it('inks all four tiers distinctly', () => {
    const inks = CITATION_BANDS.map((band) => tierInk(band.tier));
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
  // Blocking a crawler is a choice, so `blocked` may not take the worst tier's ink:
  // red would have the surface pass a judgement the engine refuses to.
  it('does not paint a blocked crawler as an alarm', () => {
    expect(accessInk('blocked')).not.toBe(BANDS.at(-1)?.ink);
  });

  it('tells the three states apart', () => {
    const inks = (['allowed', 'blocked', 'unmentioned'] as const).map(accessInk);
    expect(inks.every(Boolean)).toBe(true);
    expect(new Set(inks).size).toBe(inks.length);
  });
});
