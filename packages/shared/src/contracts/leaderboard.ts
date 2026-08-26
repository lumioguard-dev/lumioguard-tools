import { z } from 'zod';

/** Ranked either way, from the same collapsed set of hosts. */
export const leaderboardSideSchema = z.enum(['best', 'worst']);
export type LeaderboardSide = z.infer<typeof leaderboardSideSchema>;

/**
 * One host, as the board ranks it.
 *
 * No site key and no findings: a key resolves to a whole reading, and this list
 * is public. What a site was charged for stays in that site's own report.
 */
export const leaderboardRowSchema = z.object({
  host: z.string().min(1),
  score: z.number().int().min(0).max(100),
  tier: z.string(),
  readAt: z.string(),
});
export type LeaderboardRow = z.infer<typeof leaderboardRowSchema>;

export const leaderboardResponseSchema = z.object({
  side: leaderboardSideSchema,
  /**
   * The band this column IS, in the tool's own words, and the column's title.
   * Sent rather than looked up here: the ladder belongs to the engine, and a
   * second copy of it in the console is one that can disagree.
   */
  band: z.string().min(1),
  page: z.number().int().positive(),
  pageSize: z.number().int().nonnegative(),
  /** Hosts on this side of the board, already capped by the API. */
  total: z.number().int().nonnegative(),
  rows: z.array(leaderboardRowSchema),
});
export type LeaderboardResponse = z.infer<typeof leaderboardResponseSchema>;
