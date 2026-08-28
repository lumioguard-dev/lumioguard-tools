/** A board is a few kilobytes; the console should not hang on a slow API. */
const TIMEOUT_MS = 5000;

/** Ranked either way, from the same collapsed set. */
export type LeaderboardSide = 'best' | 'worst';

/** One host, as the board ranks it. No site key: this is public. */
export interface LeaderboardRow {
  readonly host: string;
  readonly score: number;
  readonly tier: string;
  readonly readAt: string;
}

export interface LeaderboardPage {
  readonly side: LeaderboardSide;
  /** The band this column is, in the tool's own words. */
  readonly band: string;
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly rows: readonly LeaderboardRow[];
}

/** The slice of `fetch` this needs, and no more. */
export type BoardTransport = (
  url: string,
  init: { readonly signal?: AbortSignal },
) => Promise<{ readonly ok: boolean; readonly json: () => Promise<unknown> }>;

/**
 * The board, read from LumioGuard. Proxied through this Worker rather than the
 * browser: the console is open source and carries no LumioGuard address, so going
 * direct would bake one into the bundle and need CORS on an API we do not own.
 */
export class LeaderboardReader {
  private readonly send: BoardTransport;

  /**
   * A WRAPPER, not `globalThis.fetch` itself: Workers' fetch throws "Illegal
   * invocation" once detached from the global, and a field detaches it.
   */
  public constructor(send: BoardTransport = (url, init) => fetch(url, init)) {
    this.send = send;
  }

  /**
   * The page, or null when it could not be read. Never throws: a board that is
   * unavailable is a panel that says so, not a failed request to the console.
   */
  public async read(
    base: string,
    side: LeaderboardSide,
    page: number,
  ): Promise<LeaderboardPage | null> {
    const url = `${base}/api/external/slopmeter/leaderboard?side=${side}&page=${page}`;
    try {
      const response = await this.send(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!response.ok) return null;
      return asPage(await response.json(), side, page);
    } catch {
      return null;
    }
  }
}

/** Narrowed, not trusted: this crosses a network before it reaches a screen. */
function asPage(body: unknown, side: LeaderboardSide, page: number): LeaderboardPage | null {
  if (typeof body !== 'object' || body === null) return null;
  const raw = body as Record<string, unknown>;
  if (!Array.isArray(raw.rows) || typeof raw.band !== 'string') return null;

  const rows: LeaderboardRow[] = [];
  for (const item of raw.rows) {
    if (typeof item !== 'object' || item === null) continue;
    const row = item as Record<string, unknown>;
    if (typeof row.host !== 'string' || typeof row.score !== 'number') continue;
    rows.push({
      host: row.host,
      score: row.score,
      tier: typeof row.tier === 'string' ? row.tier : '',
      readAt: typeof row.readAt === 'string' ? row.readAt : '',
    });
  }

  return {
    side,
    band: typeof raw.band === 'string' ? raw.band : '',
    page,
    pageSize: typeof raw.pageSize === 'number' ? raw.pageSize : rows.length,
    total: typeof raw.total === 'number' ? raw.total : rows.length,
    rows,
  };
}
