import { describe, expect, it } from 'vitest';
import {
  EXPOSURE_BANDS,
  EXPOSURE_CRITICAL_CEILING,
  ExposureTier,
  exposureBandFor,
} from '../exposureTier.js';

/** Geometry is covered for every ladder at once in `ladders.test.ts`. */
describe('the exposure ladder', () => {
  it('runs from the worst band to the best, in this tool’s own words', () => {
    expect(EXPOSURE_BANDS.map((band) => [band.tier, band.from, band.to])).toEqual([
      [ExposureTier.WideOpen, 0, 40],
      [ExposureTier.Cracked, 41, 60],
      [ExposureTier.Exposed, 61, 80],
      [ExposureTier.Sealed, 81, 100],
    ]);
  });

  it('resolves a score from beyond either end of the scale', () => {
    expect(exposureBandFor(-40).tier).toBe(ExposureTier.WideOpen);
    expect(exposureBandFor(4000).tier).toBe(ExposureTier.Sealed);
  });

  /**
   * The ceiling and the band it names must be ONE number: as two literals they
   * could be retuned apart, landing a critical finding a tier above the one the
   * README promises.
   */
  it('pins a critical finding down into the worst band', () => {
    expect(EXPOSURE_CRITICAL_CEILING).toBe(EXPOSURE_BANDS[0]?.to);
    expect(exposureBandFor(EXPOSURE_CRITICAL_CEILING).tier).toBe(ExposureTier.WideOpen);
  });
});
