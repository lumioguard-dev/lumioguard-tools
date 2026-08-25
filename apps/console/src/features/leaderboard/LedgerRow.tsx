import type { LeaderboardRow } from '@lumioguard/shared';
import { VERDICT_SCALE } from '../../tools/slopmeter/theme.js';

export function LedgerRow({
  place,
  row,
  href,
  onOpen,
}: {
  readonly place: number;
  readonly row: LeaderboardRow;
  readonly href: string;
  /** Given, a plain click reads the site here instead of loading the page. */
  readonly onOpen?: (host: string) => void;
}): JSX.Element {
  return (
    <a
      href={href}
      // A link, not a button, even where it reads in place: middle-click, the
      // context menu and every modified click stay real navigation.
      onClick={
        onOpen === undefined
          ? undefined
          : (event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              onOpen(row.host);
            }
      }
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
