import type { LeaderboardRow } from '@lumioguard/shared';

/** One place on the board. The same row whether five are shown or fifty. */
export function Rank({
  place,
  row,
}: {
  readonly place: number;
  readonly row: LeaderboardRow;
}): JSX.Element {
  return (
    <li className="flex items-baseline gap-3 border-b border-pen-900 py-[9px] last:border-b-0">
      <span className="w-[24px] shrink-0 text-right font-hand text-16 tabular-nums text-ink-3">
        {place}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body leading-[1.3] text-ink-1">{row.host}</span>
        <span className="mt-[1px] block text-caption text-ink-3">{row.tier}</span>
      </span>
      <span className="shrink-0 font-hand text-20 tabular-nums text-ink-1">{row.score}</span>
    </li>
  );
}
