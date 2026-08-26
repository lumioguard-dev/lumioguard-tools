import type { LeaderboardSide } from '@lumioguard/shared';
import { Panel, PanelGrid, PanelHead } from '@lumioguard/ui';
import { useState } from 'react';
import { LEADERBOARD_TOOL, toolCopy } from '../../tools/catalogue.js';
import { BoardBody } from './BoardBody.js';
import { WAITING } from './board.js';
import { useBoard } from './useBoard.js';

/** Vite's asset base, without its trailing slash. `''` when served at a root. */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const STEP =
  'rounded-drawn-chip border-2 border-pen-700 px-[13px] py-[6px] font-sans text-13 text-ink-1 transition-colors hover:border-pen-600 hover:bg-paper-high disabled:cursor-default disabled:opacity-40 disabled:hover:border-pen-700 disabled:hover:bg-transparent';

/**
 * One band, in its own box.
 *
 * Each side pages on its own: they rank different sets, so a single pager would
 * have to advance both at once and one of them is usually one row long.
 */
function Board({
  side,
  hand,
}: { readonly side: LeaderboardSide; readonly hand: 'a' | 'b' }): JSX.Element {
  const [page, setPage] = useState(1);
  const board = useBoard(side, page);
  const { data } = board;

  const pages = data === null || data.pageSize === 0 ? 0 : Math.ceil(data.total / data.pageSize);

  return (
    <Panel hand={hand} span={6}>
      {/* The band names the box, so no row inside has to repeat it. */}
      <PanelHead
        title={data?.band ?? WAITING[side]}
        kicker={data === null ? undefined : `${data.total} ${data.total === 1 ? 'site' : 'sites'}`}
      />

      <BoardBody board={board} />

      {pages > 1 && (
        <nav className="mt-auto flex items-center gap-3 pt-5" aria-label={`${data?.band} pages`}>
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

/** The two ends of the ladder, each in its own box. */
export function LeaderboardView(): JSX.Element {
  const tool = toolCopy(LEADERBOARD_TOOL);

  return (
    <PanelGrid>
      {/* The way back is the reading this board is of, not the browser's back
          button: a visitor may have arrived here from a search result. */}
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

      <Board side="best" hand="a" />
      <Board side="worst" hand="b" />
    </PanelGrid>
  );
}
