import type { LeaderboardResponse, LeaderboardSide } from '@lumioguard/shared';
import { useEffect, useState } from 'react';
import { LeaderboardClient } from './LeaderboardClient.js';

const client = new LeaderboardClient();

export interface BoardState {
  readonly data: LeaderboardResponse | null;
  readonly reading: boolean;
  /** A failure, which is not the same fact as an empty board. */
  readonly failed: boolean;
  readonly retry: () => void;
}

/** One side of the board, read and re-readable. Shared by the board and its preview. */
export function useBoard(side: LeaderboardSide, page: number): BoardState {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [reading, setReading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // `attempt` is not read in here: it IS the trigger, and bumping it is what
  // asks the board again after a failed load.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the extra dep is the point
  useEffect(() => {
    const abort = new AbortController();
    setReading(true);
    setFailed(false);
    client.page(side, page, abort.signal).then((result) => {
      if (abort.signal.aborted) return;
      // Null is a FAILURE, not an empty board: the first is worth retrying and
      // the second is the answer. Read as one, a dropped request said the site
      // had never been scanned.
      if (result === null) setFailed(true);
      else setData(result);
      setReading(false);
    });
    return () => abort.abort();
  }, [side, page, attempt]);

  return { data, reading, failed, retry: () => setAttempt(attempt + 1) };
}
