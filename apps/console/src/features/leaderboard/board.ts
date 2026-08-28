import type { LeaderboardSide } from '@lumioguard/shared';
import { href } from '../../mount.js';
import { LEADERBOARD_TOOL, toolCopy } from '../../tools/catalogue.js';

export function readingHref(host: string): string {
  return `${href(`/${toolCopy(LEADERBOARD_TOOL).slug}`)}?site=${encodeURIComponent(host)}`;
}

/** Until a side has answered and can name the band it filtered on. */
export const WAITING: Record<LeaderboardSide, string> = {
  best: 'Highest scoring',
  worst: 'Lowest scoring',
};
