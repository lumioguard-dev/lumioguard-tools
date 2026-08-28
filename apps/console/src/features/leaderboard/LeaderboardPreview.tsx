import type { LeaderboardSide } from '@lumioguard/shared';
import { GAP_BELOW_ASK, MarkTemplate, Panel, PanelHead } from '@lumioguard/ui';
import { href } from '../../mount.js';
import { leaderboardPath } from '../../tools/catalogue.js';
import { BoardBody, BoardFailure } from './BoardBody.js';
import { WAITING } from './board.js';
import { type BoardState, useBoard } from './useBoard.js';

const SHOWN = 4;

/** The rule is on the SECOND, so the pair is divided once however they stack. */
function Side({
  side,
  board,
  onOpen,
  divided = false,
}: {
  readonly side: LeaderboardSide;
  readonly board: BoardState;
  readonly onOpen: (host: string) => void;
  readonly divided?: boolean;
}): JSX.Element {
  const rule = divided
    ? 'border-t border-pen-700 pt-6 lg:border-t-0 lg:border-l lg:pl-[38px] lg:pt-0'
    : 'lg:pr-[38px]';

  return (
    <div className={`min-w-0 ${rule}`}>
      <p className="m-0 font-hand text-16 text-ink-3">{board.data?.band ?? WAITING[side]}</p>
      <BoardBody board={board} limit={SHOWN} onOpen={onOpen} />
    </div>
  );
}

/** ANSWERED, with nothing in it. Not the same fact as a failure. */
function empty(board: BoardState): boolean {
  return board.data !== null && board.data.rows.length === 0;
}

/**
 * A board nobody has landed in shows nothing rather than an apology above the
 * fold; a board that could not be READ says so and offers the read again.
 */
export function LeaderboardPreview({
  onScan,
}: { readonly onScan: (address: string) => void }): JSX.Element | null {
  const best = useBoard('best', 1);
  const worst = useBoard('worst', 1);

  if (empty(best) && empty(worst)) return null;

  // Two columns of one apology read as a broken panel rather than as one outage.
  const lost = best.data === null && worst.data === null && best.failed && worst.failed;

  return (
    <Panel hand="c" span={12} className={GAP_BELOW_ASK}>
      {/* Opened in its own tab: a reader came here to scan a site, and the board
          should not take the page from them. */}
      <PanelHead
        title="Leaderboard"
        mark={<MarkTemplate />}
        trailing={
          <a
            href={href(leaderboardPath())}
            target="_blank"
            rel="noreferrer noopener"
            className="shrink-0 font-sans text-14 text-hand underline underline-offset-2 hover:no-underline"
          >
            See the whole board
          </a>
        }
      />

      {lost ? (
        <BoardFailure
          onRetry={() => {
            best.retry();
            worst.retry();
          }}
        />
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-0">
          <Side side="best" board={best} onOpen={onScan} />
          <Side side="worst" board={worst} onOpen={onScan} divided />
        </div>
      )}
    </Panel>
  );
}
