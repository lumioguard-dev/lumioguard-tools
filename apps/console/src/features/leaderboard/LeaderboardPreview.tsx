import type { LeaderboardRow } from '@lumioguard/shared';
import { MarkTemplate, Panel, PanelHead } from '@lumioguard/ui';
import { leaderboardPath } from '../../tools/catalogue.js';
import { Rank } from './Rank.js';
import { useBoard } from './useBoard.js';

/** A taste, not the board. Five keeps the panel under the fold on a laptop. */
const SHOWN = 5;

/** Vite's asset base, without its trailing slash. `''` when served at a root. */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/**
 * Presentational: the rows are read ONCE by the panel and handed down. Reading
 * them here as well put four requests in flight for two lists, and whichever
 * pair lost the race rendered an empty column.
 */
function Side({
  band,
  rows,
}: { readonly band: string; readonly rows: readonly LeaderboardRow[] }): JSX.Element {
  return (
    <div className="min-w-0 flex-1">
      <p className="m-0 font-hand text-16 text-ink-3">{band}</p>
      <ol className="m-0 mt-2 list-none p-0">
        {rows.map((row, index) => (
          <Rank key={row.host} place={index + 1} row={row} />
        ))}
      </ol>
    </div>
  );
}

/**
 * The board in miniature, under the address field. Drawn only once a side has
 * something: an empty board should show nothing here rather than two columns of
 * apology above the fold.
 */
export function LeaderboardPreview(): JSX.Element | null {
  const best = useBoard('best', 1);
  const worst = useBoard('worst', 1);

  // The band names come from the API, so this panel and the meter a visitor
  // just read call the same score the same thing.
  const sides = [best.data, worst.data].map((page) => ({
    band: page?.band ?? '',
    rows: page?.rows.slice(0, SHOWN) ?? [],
  }));
  if (sides.every((side) => side.rows.length === 0)) {
    // Silent when the board is genuinely empty: a young board should not put an
    // apology above the fold. NOT silent when it could not be read, because the
    // two looked identical and an outage read as a missing feature.
    if (!(best.failed && worst.failed)) return null;

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
      </Panel>
    );
  }

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
      <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:gap-[46px]">
        {sides.map((side) =>
          side.rows.length === 0 ? null : (
            <Side key={side.band} band={side.band} rows={side.rows} />
          ),
        )}
      </div>
    </Panel>
  );
}
