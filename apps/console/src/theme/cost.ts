import { ink, red, state } from '@lumioguard/design-tokens';

/**
 * What a finding COST, inked by the size of the number rather than by the tool
 * it came from. `cost` is points off the same 0-100 scale for every reading, so
 * one ramp is what lets a leak and a stock hero sit in one ranked list.
 *
 * The culprits panel painted these with the tool's own VERDICT ink: on a site
 * scoring 88 a 34-point blocker rendered in the same green as the seal.
 */
export function costInk(cost: number): string {
  if (cost < 0) return state.success.fg;
  if (cost >= 16) return red[400];
  if (cost >= 8) return red[300];
  return ink[2];
}
