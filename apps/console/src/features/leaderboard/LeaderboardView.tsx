import type { LeaderboardSide } from '@lumioguard/shared';
import { BackLink, Panel, PanelGrid, PanelHead } from '@lumioguard/ui';
import { useState } from 'react';
import { href } from '../../mount.js';
import { LEADERBOARD_TOOL, toolCopy } from '../../tools/catalogue.js';
import { BoardBody } from './BoardBody.js';
import { WAITING } from './board.js';
import { useBoard } from './useBoard.js';

const STEP =
  'rounded-drawn-chip border-2 border-pen-700 px-[13px] py-[6px] font-sans text-13 text-ink-1 transition-colors hover:border-pen-600 hover:bg-paper-high disabled:cursor-default disabled:opacity-40 disabled:hover:border-pen-700 disabled:hover:bg-transparent';

/**
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

export function LeaderboardView(): JSX.Element {
  const tool = toolCopy(LEADERBOARD_TOOL);

  return (
    <PanelGrid>
      {/* The way back is the reading, not the browser's back button: a visitor may
          have arrived here from a search result. */}
      <div className="col-span-6 lg:col-span-12">
        <BackLink href={href(`/${tool.slug}`)}>Back to the reading</BackLink>
      </div>

      <Board side="best" hand="a" />
      <Board side="worst" hand="b" />
    </PanelGrid>
  );
}
