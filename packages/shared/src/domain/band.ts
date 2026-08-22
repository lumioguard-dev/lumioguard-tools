/**
 * The arithmetic every tool's ladder shares, written once.
 *
 * Four ladders now run 0-100 with the same four bands, and the two calculations
 * that place a score on one were copied per tool: the same clamp-and-walk, the
 * same track width with the same off-by-one guard on the unbounded top band.
 * Three copies of a formula that must agree is the shape this repo calls a bug
 * that has not happened yet, and a fourth was about to be written.
 *
 * The band VOCABULARY stays per tool. What is shared is where a number falls,
 * never what to call it.
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
 * A band's place on the track, as percentages.
 *
 * The `min` is what keeps the unbounded top band on the track: its `to` is
 * infinity, and the width has to stop at the end of the scale rather than run
 * off it. A test asserts the bands are contiguous and fill the track exactly
 * once, which is the property this exists to hold.
 */
export function trackOf(band: ScoreBand, max: number): TrackSegment {
  return { left: band.from, width: Math.min(band.to + 1 - band.from, max - band.from) };
}

/**
 * The band a score falls in: the first whose ceiling it does not exceed.
 *
 * Total by construction rather than by assertion. An earlier shape fell out of
 * the loop and asserted the last element back into existence, which
 * `noUncheckedIndexedAccess` had correctly typed as possibly absent: the cast
 * was load-bearing for compilation and a lie if the list were ever empty.
 * Carrying the last band seen needs no such claim, so the non-empty tuple type
 * is the only guarantee required.
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
