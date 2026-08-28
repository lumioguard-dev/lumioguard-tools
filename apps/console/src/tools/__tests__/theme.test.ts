import {
  CITATION_BANDS,
  CITATION_MAX,
  EXPOSURE_BANDS,
  EXPOSURE_MAX,
  READING_BANDS,
  READING_MAX,
  SCORE_MAX,
  TIER_BANDS,
} from '@lumioguard/shared';
import type { InkedBand, VerdictScale } from '@lumioguard/ui';
import { describe, expect, it } from 'vitest';
import { BANDS as CONSOLIDATED, VERDICT_SCALE as CONSOLIDATED_SCALE } from '../../theme/reading.js';
import { BANDS as CITE, VERDICT_SCALE as CITE_SCALE } from '../citecheck/theme.js';
import { BANDS as LEAK, VERDICT_SCALE as LEAK_SCALE } from '../leakpeek/theme.js';
import { BANDS as SLOP, VERDICT_SCALE as SLOP_SCALE } from '../slopmeter/theme.js';

// ONE table, not a suite per tool: copied per tool the three drifted, and the
// consolidated ladder the big seal is stamped from had no suite at all.
const THEMES: readonly {
  readonly name: string;
  readonly bands: readonly InkedBand[];
  readonly scale: VerdictScale;
  readonly ladder: readonly { readonly tier: string }[];
  readonly max: number;
}[] = [
  { name: 'slopmeter', bands: SLOP, scale: SLOP_SCALE, ladder: TIER_BANDS, max: SCORE_MAX },
  { name: 'leakpeek', bands: LEAK, scale: LEAK_SCALE, ladder: EXPOSURE_BANDS, max: EXPOSURE_MAX },
  { name: 'citecheck', bands: CITE, scale: CITE_SCALE, ladder: CITATION_BANDS, max: CITATION_MAX },
  {
    name: 'consolidated',
    bands: CONSOLIDATED,
    scale: CONSOLIDATED_SCALE,
    ladder: READING_BANDS,
    max: READING_MAX,
  },
];

// Names no ladder carries, including two these USED to. Checked against every
// ladder: a name retired from one is what another may be handed by a stale link.
const RETIRED = [
  'Likely Generated',
  'Suspiciously Clean',
  'Wide Open ',
  '',
  'pure slop',
  'PURE SLOP',
  'legible',
];

describe.each(THEMES)('$name bands', ({ bands, ladder, max }) => {
  it('carries every band the shared ladder defines, in order', () => {
    expect(bands.map((band) => band.tier)).toEqual(ladder.map((band) => band.tier));
  });

  // Two bands sharing a colour makes the verdict unreadable: the seal and the needle
  // would say different things about one score.
  it('gives each band its own ink', () => {
    for (const band of bands) expect(band.ink, `${band.tier} has no ink`).toBeTruthy();
    expect(new Set(bands.map((band) => band.ink)).size).toBe(bands.length);
  });

  it('lays the track out left to right without gaps or overlap', () => {
    let left = 0;
    for (const band of bands) {
      expect(band.track.left).toBeCloseTo(left, 5);
      expect(band.track.width).toBeGreaterThan(0);
      left += band.track.width;
    }
    expect(left).toBeCloseTo(100, 5);
  });

  it('starts at the floor of the scale and ends at its top', () => {
    expect(bands[0]?.from).toBe(0);
    expect(bands.at(-1)?.to).toBe(max);
  });
});

describe.each(THEMES)('$name verdict scale', ({ bands, scale, max }) => {
  it('tops out at the scale, so the needle is clamped to the right place', () => {
    expect(scale.max).toBe(max);
  });

  it('inks every real tier the same way the band does', () => {
    for (const band of bands) expect(scale.inkFor(band.tier)).toBe(band.ink);
  });

  // Why `inkFor` looks up rather than casting: a cast hands the record a key it may
  // not have, and the miss reaches an inline style and paints the seal no colour.
  it('still returns a usable colour for a tier it has never heard of', () => {
    for (const tier of RETIRED) {
      const result = scale.inkFor(tier);
      expect(result, tier).toBeTruthy();
      expect(result, tier).not.toContain('undefined');
    }
  });
});
