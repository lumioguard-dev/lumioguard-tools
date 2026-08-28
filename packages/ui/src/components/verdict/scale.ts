import { ink } from '@lumioguard/design-tokens';
import { type ScoreBand, trackOf } from '@lumioguard/shared';

/**
 * INJECTED rather than imported: the bands are the only thing that varies between
 * tools, and passing them keeps the components free of any one tool's vocabulary.
 */
export interface InkedBand {
  readonly tier: string;
  readonly from: number;
  readonly to: number;
  readonly description: string;
  readonly ink: string;
  readonly track: { readonly left: number; readonly width: number };
}

export interface VerdictScale {
  readonly bands: readonly InkedBand[];
  /** Top of the track. The needle is clamped to it. */
  readonly max: number;
  readonly inkFor: (tier: string) => string;
}

/** Written once: every tool wrote this `.map` out over its own `trackOf` wrapper. */
export function inkedBands<T extends ScoreBand>(
  bands: readonly T[],
  max: number,
  inkOf: (tier: T['tier']) => string,
): readonly InkedBand[] {
  return bands.map((band) => ({ ...band, ink: inkOf(band.tier), track: trackOf(band, max) }));
}

/**
 * `inkFor` LOOKS UP rather than asserting: a cast hands the record a key it may
 * not have, and the miss reaches an inline style and paints the seal no colour.
 */
export function verdictScale(
  bands: readonly InkedBand[],
  max: number,
  fallbackInk: string = ink[2],
): VerdictScale {
  return {
    bands,
    max,
    inkFor: (tier) => bands.find((candidate) => candidate.tier === tier)?.ink ?? fallbackInk,
  };
}
