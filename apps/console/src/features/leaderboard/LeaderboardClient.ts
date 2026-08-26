import {
  type LeaderboardResponse,
  type LeaderboardSide,
  leaderboardResponseSchema,
} from '@lumioguard/shared';
import { apiBase } from '../../tools/apiBase.js';

/**
 * The board, read through Slopmeter's Worker.
 *
 * Not from LumioGuard directly: this bundle is open source and carries no
 * LumioGuard address, and the Worker already holds one. Where a reading returns
 * an error the visitor must act on, an unreadable board is just an empty panel,
 * so this answers null rather than throwing.
 */
export class LeaderboardClient {
  private readonly base: string;

  public constructor(base: string = apiBase('slopmeter')) {
    this.base = base;
  }

  public async page(
    side: LeaderboardSide,
    page: number,
    signal?: AbortSignal,
  ): Promise<LeaderboardResponse | null> {
    try {
      const response = await fetch(`${this.base}/api/leaderboard?side=${side}&page=${page}`, {
        signal,
      });
      if (!response.ok) return null;
      // Validated, not cast: a shape change should surface here rather than as
      // an undefined inside a table row.
      const parsed = leaderboardResponseSchema.safeParse(await response.json());
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }
}
