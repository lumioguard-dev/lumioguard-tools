/**
 * The arithmetic every tool's ladder shares, written once: four ladders run
 * 0-100 over the same bands, and three copies of the clamp-and-walk had to agree.
 * The band VOCABULARY stays per tool: where a number falls is shared, not its name.
 */

/** The shape a ladder's band must have. Each tool narrows `tier` to its own union. */
export interface ScoreBand {
  readonly tier: string;
  readonly from: number;
  /** Inclusive. Unbounded on the last band so any score resolves. */
  readonly to: number;
  readonly description: string;
}

export interface TrackSegment {
  readonly left: number;
  readonly width: number;
}

/**
 * A band's place on the track, as percentages. The `min` keeps the unbounded top
 * band on it: that band's `to` is infinity, so the width must stop at the end of
 * the scale. A test asserts the bands fill the track exactly once.
 */
export function trackOf(band: ScoreBand, max: number): TrackSegment {
  return { left: band.from, width: Math.min(band.to + 1 - band.from, max - band.from) };
}

/**
 * The band a score falls in: the first whose ceiling it does not exceed. Total by
 * construction, not by assertion: an earlier shape asserted the last element back
 * into existence, a cast that was a lie if the list were ever empty.
 */
export function bandOf<T extends ScoreBand>(
  bands: readonly [T, ...T[]],
  score: number,
  bounds: { readonly min: number; readonly max: number },
): T {
  const clamped = Math.max(bounds.min, Math.min(bounds.max, score));
  let match = bands[0];
  for (const band of bands) {
    match = band;
    if (clamped <= band.to) break;
  }
  return match;
}

/**
 * The four edges every ladder uses. HIGHER IS BETTER: engines compute a
 * penalty, and each scorer subtracts it from the top once. Shared, because the
 * consolidated score is always some tool's own and must band identically.
 */
export const BAND_EDGES = [
  { from: 0, to: 40 },
  { from: 41, to: 60 },
  { from: 61, to: 80 },
  { from: 81, to: 100 },
] as const;
