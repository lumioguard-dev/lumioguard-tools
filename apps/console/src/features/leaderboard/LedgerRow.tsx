import type { LeaderboardRow } from '@lumioguard/shared';
import { VERDICT_SCALE } from '../../tools/slopmeter/theme.js';

/**
 * One line of the ledger.
 *
 * Rank sits in a ruled margin rather than floating at the left, which is what
 * stops a run of these reading as a checklist. No band on the line: the panel
 * it sits in is that band, so printing it per row said the same word eleven
 * times. The score keeps the band's ink through `inkFor`, which takes a plain
 * string and falls back, because the wire carries a tier this surface does not
 * own the vocabulary for.
 */
export function LedgerRow({
  place,
  row,
  href,
}: {
  readonly place: number;
  readonly row: LeaderboardRow;
  readonly href: string;
}): JSX.Element {
  return (
    <a
      href={href}
      className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-stretch gap-x-4 border-t border-pen-900 px-1 transition-colors first:border-t-0 hover:bg-paper-high focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-pen-300"
    >
      <span className="flex items-center justify-end border-r border-pen-800 py-[10px] pr-3 font-hand text-15 text-ink-4">
        {place}
      </span>
      <span className="min-w-0 self-center truncate py-[10px] text-15 leading-[1.3] text-ink-1">
        {row.host}
      </span>
      <span
        className="self-center py-[10px] text-right text-18 font-bold tabular-nums"
        style={{ color: VERDICT_SCALE.inkFor(row.tier) }}
      >
        {row.score}
      </span>
    </a>
  );
}
