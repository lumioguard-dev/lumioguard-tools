import { TIER_BANDS } from '@lumioguard/shared';
import { describe, expect, it } from 'vitest';
import { tierInk, weightInk } from '../theme.js';

// The ladder, the track and the unknown-tier fallback are proven for every tool at
// once in `src/tools/__tests__/theme.test.ts`. Only this reading's own is left here.

describe('slopmeter inks', () => {
  it('inks all four tiers distinctly', () => {
    const inks = TIER_BANDS.map((band) => tierInk(band.tier));
    expect(inks.every(Boolean)).toBe(true);
    expect(new Set(inks).size).toBe(inks.length);
  });

  // A heavy tell that reads like a light one is the failure that matters here.
  it('does not let a heavy tell look like a light one', () => {
    expect(weightInk(35)).not.toBe(weightInk(3));
    expect(weightInk(35)).not.toBe(weightInk(9));
  });

  // Credits run the other way, so they must not share the charges' ink.
  it('draws a credit apart from every charge', () => {
    expect(weightInk(-4)).not.toBe(weightInk(35));
    expect(weightInk(-4)).not.toBe(weightInk(3));
  });
});
