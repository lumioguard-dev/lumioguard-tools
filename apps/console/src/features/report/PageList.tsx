import { Panel, PanelHead } from '@lumioguard/ui';
import type { Reading } from '../scan/useReadings.js';

interface Row {
  readonly url: string;
  readonly depth: number;
  /** One entry per tool that reached this URL, in registry order. */
  readonly scores: readonly {
    readonly tool: string;
    readonly score: number;
    readonly ink: string;
  }[];
  /** The worst score any reading gave it, which is what the list sorts on. */
  readonly worst: number;
}

/**
 * Every page every crawl read, as ONE table.
 *
 * Two tools crawl, and each used to own a door to its own table of, largely,
 * the same URLs. A reader comparing them had to hold two lists in their head to
 * answer the only question the panel is for: which page is the bad one. Merged
 * by URL, that answer is a row.
 *
 * Sorted by the WORST score any reading gave a page, so the page that most
 * needs looking at is first whichever tool found it.
 */
function merge(readings: readonly Reading[]): Row[] {
  const byUrl = new Map<string, { url: string; depth: number; scores: Row['scores'] }>();

  for (const reading of readings) {
    const pages = reading.outcome?.pages;
    if (pages === undefined) continue;
    for (const page of pages.rows) {
      const existing = byUrl.get(page.url);
      const entry = {
        tool: reading.tool.label,
        score: page.score,
        ink: reading.outcome?.ink ?? '',
      };
      if (existing === undefined) {
        byUrl.set(page.url, { url: page.url, depth: page.depth, scores: [entry] });
        continue;
      }
      byUrl.set(page.url, {
        ...existing,
        // The shallowest depth wins: one crawler reaching a page in one click
        // and another in three does not make it a three-click page.
        depth: Math.min(existing.depth, page.depth),
        scores: [...existing.scores, entry],
      });
    }
  }

  return (
    [...byUrl.values()]
      .map((row) => ({
        ...row,
        worst: row.scores.reduce((worst, entry) => Math.min(worst, entry.score), 100),
      }))
      // Worst FIRST, and worst is the lowest: higher is better.
      .sort((a, b) => a.worst - b.worst)
  );
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export function PageList({
  readings,
  onBack,
}: {
  readonly readings: readonly Reading[];
  readonly onBack: () => void;
}): JSX.Element {
  const crawled = readings.filter((reading) => reading.outcome?.pages !== undefined);
  const rows = merge(readings);
  const deepest = crawled.reduce(
    (deep, reading) => Math.max(deep, reading.outcome?.pages?.maxDepth ?? 0),
    0,
  );

  return (
    <>
      <div className="col-span-6 lg:col-span-12">
        <button
          type="button"
          onClick={onBack}
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
        </button>
      </div>

      <Panel hand="a" span={12}>
        <PanelHead
          title="Pages checked"
          kicker={`${plural(rows.length, 'page')} · ${plural(deepest, 'click')} deep`}
        />

        {/* Scrolls inside itself. A tool column per crawler means the table
            widens with the registry, and the page body must never scroll
            sideways because a fourth tool was added. */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-dashed border-pen-700/40">
                <th className="py-2 pr-4 font-hand text-14 font-normal lowercase tracking-wide text-ink-3">
                  page
                </th>
                {crawled.map((reading) => (
                  <th
                    key={reading.tool.id}
                    className="py-2 pl-4 text-right font-hand text-14 font-normal lowercase tracking-wide text-ink-3"
                  >
                    {reading.tool.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.url} className="border-b border-pen-900 last:border-b-0">
                  <td className="min-w-0 py-[10px] pr-4">
                    <span className="block break-all text-body leading-[1.35] text-ink-1">
                      {row.url}
                    </span>
                    <span className="mt-[2px] block text-caption text-ink-3">
                      {row.depth === 0 ? 'front page' : `${plural(row.depth, 'click')} deep`}
                    </span>
                  </td>
                  {crawled.map((reading) => {
                    const hit = row.scores.find((entry) => entry.tool === reading.tool.label);
                    return (
                      <td
                        key={reading.tool.id}
                        className="py-[10px] pl-4 text-right align-top font-hand text-20 tabular-nums"
                        style={hit === undefined ? undefined : { color: hit.ink }}
                      >
                        {/* An em dash would be wrong here and a hyphen reads as
                            a minus beside numbers, so a tool that never reached
                            the page says so. */}
                        {hit === undefined ? (
                          <span className="font-sans text-13 text-ink-3">not read</span>
                        ) : (
                          hit.score
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
