import { LedgerRow } from './LedgerRow.js';
import { readingHref } from './board.js';
import type { BoardState } from './useBoard.js';

const LINE = 'mt-4 text-body';

/** The ONE way the board says it could not be read; the preview once had its own. */
export function BoardFailure({ onRetry }: { readonly onRetry: () => void }): JSX.Element {
  return (
    <p className={`${LINE} text-ink-2`}>
      The board could not be read.{' '}
      <button
        type="button"
        className="underline underline-offset-2 hover:text-hand"
        onClick={onRetry}
      >
        Try again
      </button>
    </p>
  );
}

/**
 * Written once because the board and its preview must answer alike: the preview
 * read a dropped request as a band nobody had landed in, under a live 502.
 */
export function BoardBody({
  board,
  limit,
  onOpen,
}: {
  readonly board: BoardState;
  readonly limit?: number;
  /** Given, a row reads its site in place rather than loading the page. */
  readonly onOpen?: (host: string) => void;
}): JSX.Element {
  const { data, reading, failed, retry } = board;

  if (data === null) {
    if (reading) return <p className={`${LINE} text-ink-3`}>Reading the board…</p>;
    if (failed) return <BoardFailure onRetry={retry} />;
  }

  if (data === null || data.rows.length === 0) {
    return <p className={`${LINE} text-ink-2`}>No site has landed in this band yet.</p>;
  }

  const first = (data.page - 1) * data.pageSize;
  const rows = limit === undefined ? data.rows : data.rows.slice(0, limit);

  return (
    <div className="mt-4" style={{ opacity: reading ? 0.5 : 1 }}>
      {rows.map((row, index) => (
        <LedgerRow
          key={row.host}
          place={first + index + 1}
          row={row}
          href={readingHref(row.host)}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
