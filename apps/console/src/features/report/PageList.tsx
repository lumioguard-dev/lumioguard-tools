import { BackLink, Panel, PanelHead } from '@lumioguard/ui';
import type { Reading } from '../scan/useReadings.js';

interface Row {
  readonly url: string;
  readonly depth: number;
  /** Keyed by id: two readings can share a label, and matching on it collapsed a column. */
  readonly scores: readonly {
    readonly toolId: string;
    readonly score: number;
    readonly ink: string;
  }[];
  readonly worst: number;
}

/**
 * Every crawl merged into ONE table, keyed by URL. A door per crawler made the
 * reader hold two lists in their head to answer the only question the panel is
 * for: which page is the bad one. Sorted by the WORST score any reading gave.
 */
function merge(readings: readonly Reading[]): Row[] {
  const byUrl = new Map<string, { url: string; depth: number; scores: Row['scores'] }>();

  for (const reading of readings) {
    const pages = reading.outcome?.pages;
    if (pages === undefined) continue;
    for (const page of pages.rows) {
      const existing = byUrl.get(page.url);
      const entry = {
        toolId: reading.tool.id,
        score: page.score,
        ink: reading.outcome?.ink ?? '',
      };
      if (existing === undefined) {
        byUrl.set(page.url, { url: page.url, depth: page.depth, scores: [entry] });
        continue;
      }
      byUrl.set(page.url, {
        ...existing,
        // The shallowest depth wins: reached in one click by one crawler and three
        // by another does not make it a three-click page.
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
        <BackLink onClick={onBack}>Back to the reading</BackLink>
      </div>

      <Panel hand="a" span={12}>
        <PanelHead
          title="Pages checked"
          kicker={`${plural(rows.length, 'page')} · ${plural(deepest, 'click')} deep`}
        />

        {/* Scrolls inside itself: a tool column per crawler widens the table with
            the registry, and the page body must never scroll sideways. */}
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
                    const hit = row.scores.find((entry) => entry.toolId === reading.tool.id);
                    return (
                      <td
                        key={reading.tool.id}
                        className="py-[10px] pl-4 text-right align-top font-hand text-20 tabular-nums"
                        style={hit === undefined ? undefined : { color: hit.ink }}
                      >
                        {/* A hyphen reads as a minus beside numbers, so a tool that
                            never reached the page says so in words. */}
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
