import {
  type LeaderboardResponse,
  type LeaderboardSide,
  leaderboardResponseSchema,
} from '@lumioguard/shared';
import { apiBase } from '../../tools/apiBase.js';
import { LEADERBOARD_TOOL } from '../../tools/catalogue.js';

/**
 * Read through Slopmeter's Worker, never LumioGuard directly: this bundle is open
 * source and carries no LumioGuard address. An unreadable board is an empty panel
 * rather than an error, so this answers null rather than throwing.
 */
export class LeaderboardClient {
  private readonly base: string;

  public constructor(base: string = apiBase(LEADERBOARD_TOOL)) {
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
      // Validated, not cast: a shape change surfaces here, not as an undefined in a row.
      const parsed = leaderboardResponseSchema.safeParse(await response.json());
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }
}
