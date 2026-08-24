import type { LeaderboardSide } from '@lumioguard/shared';
import { Panel, PanelGrid, PanelHead } from '@lumioguard/ui';
import { useState } from 'react';
import { LEADERBOARD_TOOL, toolCopy } from '../../tools/catalogue.js';
import { Rank } from './Rank.js';
import { useBoard } from './useBoard.js';

/** Vite's asset base, without its trailing slash. `''` when served at a root. */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** What the column is, in plain words. The band it filtered on sits beneath. */
const TITLE: Record<LeaderboardSide, string> = {
  best: 'Highest scoring',
  worst: 'Lowest scoring',
};

/** An empty band and an unreadable one are different facts, and read as such. */
const EMPTY = 'No site has landed in this band yet.';
const UNREADABLE = 'The board could not be read.';

const STEP =
  'rounded-drawn-chip border-2 border-pen-700 px-[14px] py-[7px] font-sans text-14 text-ink-1 transition-colors hover:border-pen-600 hover:bg-paper-high disabled:cursor-default disabled:opacity-40 disabled:hover:border-pen-700 disabled:hover:bg-transparent';

/** One side of the board, paged on its own: the two columns rank different sets. */
function Column({
  side,
  hand,
}: { readonly side: LeaderboardSide; readonly hand: 'a' | 'b' }): JSX.Element {
  const [page, setPage] = useState(1);
  const { data, reading, failed, retry } = useBoard(side, page);

  const pages = data === null || data.pageSize === 0 ? 0 : Math.ceil(data.total / data.pageSize);
  const first = data === null ? 0 : (data.page - 1) * data.pageSize;

  return (
    <Panel hand={hand} span={6}>
      {/* The band comes from the API, never a second copy of the ladder here:
          this and the meter must call the same score the same thing. */}
      <PanelHead title={TITLE[side]} kicker={data?.band} />

      {reading && data === null ? (
        <p className="mt-4 text-body text-ink-3">Reading the board…</p>
      ) : failed && data === null ? (
        <p className="mt-4 text-body text-ink-2">
          {UNREADABLE}{' '}
          <button
            type="button"
            className="underline underline-offset-2 hover:text-hand"
            onClick={retry}
          >
            Try again
          </button>
        </p>
      ) : data === null || data.rows.length === 0 ? (
        <p className="mt-4 text-body text-ink-2">{EMPTY}</p>
      ) : (
        <ol className="m-0 mt-4 list-none p-0" style={{ opacity: reading ? 0.5 : 1 }}>
          {data.rows.map((row, index) => (
            <Rank key={row.host} place={first + index + 1} row={row} />
          ))}
        </ol>
      )}

      {pages > 1 && (
        <nav className="mt-auto flex items-center gap-3 pt-5" aria-label={`${TITLE[side]} pages`}>
          <button
            type="button"
            className={STEP}
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            ← Back
          </button>
          <span className="text-13 leading-[1.5] text-ink-3">
            Page {page} of {pages}
          </span>
          <button
            type="button"
            className={STEP}
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
          >
            Next →
          </button>
        </nav>
      )}
    </Panel>
  );
}

/**
 * What the readings add up to: the sites that look least and most like every
 * other AI-built site. One row per host, the latest reading of it.
 */
export function LeaderboardView(): JSX.Element {
  const tool = toolCopy(LEADERBOARD_TOOL);

  return (
    <PanelGrid>
      {/* The way back is the reading this board is of, not the browser's back
          button: a visitor may have arrived here from a search result. */}
      {/* An anchor, not the report's button: this is its own page and a visitor
          may have arrived from a search result with nothing to go back to. The
          chip is the report's, so the two read as one control. */}
      <div className="col-span-6 lg:col-span-12">
        <a
          href={`${BASE}/${tool.slug}`}
          className="inline-flex items-center gap-[9px] rounded-drawn-chip border-[1.6px] border-pen-700 bg-transparent px-4 py-[9px] font-sans text-15 font-medium text-ink-1 transition-colors hover:border-pen-600 hover:bg-paper-high"
        >
          <svg
            viewBox="0 0 20 12"
            className="h-[12px] w-[20px] fill-none stroke-current"
            aria-hidden="true"
            strokeWidth={1.8}
            strokeLinecap="round"
          >
            <path d="M19 6.1c-6-.5-12.1-.7-18-.4M6 1.2C4.2 2.9 2.5 4.6.9 6.3c1.7 1.7 3.4 3.4 5.2 5" />
          </svg>
          Back to the reading
        </a>
      </div>
      <Column side="best" hand="a" />
      <Column side="worst" hand="b" />
    </PanelGrid>
  );
}
