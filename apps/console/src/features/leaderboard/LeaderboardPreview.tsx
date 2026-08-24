import type { LeaderboardSide } from '@lumioguard/shared';
import { MarkTemplate, Panel, PanelHead } from '@lumioguard/ui';
import { leaderboardPath } from '../../tools/catalogue.js';
import { BoardBody } from './BoardBody.js';
import { WAITING } from './board.js';
import { type BoardState, useBoard } from './useBoard.js';

/** The head of each band, not the board. */
const SHOWN = 4;

/** Vite's asset base, without its trailing slash. `''` when served at a root. */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/**
 * One band's column. The rule is on the second, so the pair is divided once
 * however they are stacked: along the top below `lg`, down the side above it.
 */
function Side({
  side,
  board,
  divided = false,
}: {
  readonly side: LeaderboardSide;
  readonly board: BoardState;
  readonly divided?: boolean;
}): JSX.Element {
  const rule = divided
    ? 'border-t border-pen-700 pt-6 lg:border-t-0 lg:border-l lg:pl-[38px] lg:pt-0'
    : 'lg:pr-[38px]';

  return (
    <div className={`min-w-0 ${rule}`}>
      <p className="m-0 font-hand text-16 text-ink-3">{board.data?.band ?? WAITING[side]}</p>
      <BoardBody board={board} limit={SHOWN} />
    </div>
  );
}

/** A side that has ANSWERED, with nothing in it. Not the same fact as a failure. */
function empty(board: BoardState): boolean {
  return board.data !== null && board.data.rows.length === 0;
}

/**
 * The board in miniature, under the address field. A board nobody has landed in
 * shows nothing rather than an apology above the fold, but a board that could
 * not be READ says so and offers the read again.
 */
export function LeaderboardPreview(): JSX.Element | null {
  const best = useBoard('best', 1);
  const worst = useBoard('worst', 1);

  if (empty(best) && empty(worst)) return null;

  // Two columns of the same apology read as a broken panel rather than one
  // outage, so a board that failed on both sides says it once.
  const lost = best.data === null && worst.data === null && best.failed && worst.failed;

  return (
    <Panel hand="c" span={12} className="mt-6">
      {/* The heading IS the way through, opened in its own tab: a reader here
          came to scan a site, and the board should not take the page from them. */}
      <PanelHead
        title="Leaderboard"
        mark={<MarkTemplate />}
        trailing={
          <a
            href={`${BASE}${leaderboardPath()}`}
            target="_blank"
            rel="noreferrer noopener"
            className="shrink-0 font-sans text-14 text-hand underline underline-offset-2 hover:no-underline"
          >
            See the whole board
          </a>
        }
      />

      {lost ? (
        <p className="mt-4 text-body text-ink-2">
          The board could not be read.{' '}
          <button
            type="button"
            className="underline underline-offset-2 hover:text-hand"
            onClick={() => {
              best.retry();
              worst.retry();
            }}
          >
            Try again
          </button>
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-0">
          <Side side="best" board={best} />
          <Side side="worst" board={worst} divided />
        </div>
      )}
    </Panel>
  );
}
