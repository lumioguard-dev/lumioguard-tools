import { EXPOSURE_BANDS } from '@lumioguard/shared';
import { describe, expect, it } from 'vitest';
import { severityInk, tierInk } from '../theme.js';

// The ladder, the track and the unknown-tier fallback are proven for every tool at
// once in `src/tools/__tests__/theme.test.ts`. Only this reading's own is left here.

describe('leakpeek inks', () => {
  it('inks all four tiers distinctly', () => {
    const inks = EXPOSURE_BANDS.map((band) => tierInk(band.tier));
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
