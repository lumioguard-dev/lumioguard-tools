import type { LeaderboardSide } from '@lumioguard/shared';
import { LEADERBOARD_TOOL, toolCopy } from '../../tools/catalogue.js';

/** Vite's asset base, without its trailing slash. `''` when served at a root. */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Reading a site is the reading's own page with the address already in it. */
export function readingHref(host: string): string {
  return `${BASE}/${toolCopy(LEADERBOARD_TOOL).slug}?site=${encodeURIComponent(host)}`;
}

/** Until a side has answered and can name the band it filtered on. */
export const WAITING: Record<LeaderboardSide, string> = {
  best: 'Highest scoring',
  worst: 'Lowest scoring',
};
