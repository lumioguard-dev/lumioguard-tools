import { Panel } from '@lumioguard/ui';
import type { Reading } from '../scan/useReadings.js';

/**
 * ONE way into the page list, at the end of the report.
 *
 * One control, not one per crawler. Two buttons reading "Slopmeter 1 page" and
 * "Citecheck 1 page" made the reader choose a tool before they could ask which
 * page was the bad one, which is a question about the site rather than about
 * either tool. The list behind this merges them.
 */
export function PageLists({
  readings,
  onOpen,
}: {
  readonly readings: readonly Reading[];
  readonly onOpen: () => void;
}): JSX.Element | null {
  const crawled = readings.filter((reading) => reading.outcome?.pages !== undefined);
  if (crawled.length === 0) return null;

  const urls = new Set(
    crawled.flatMap((reading) => (reading.outcome?.pages?.rows ?? []).map((row) => row.url)),
  );

  return (
    <Panel
      hand="d"
      span={12}
      className="settles-in settles-in--late !flex-row !flex-wrap !items-center !gap-6 !px-6 !py-[13px]"
    >
      <div className="min-w-0 flex-[1_1_22rem]">
        <p className="pen-title !text-17 !leading-[1.25]">Pages checked</p>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="whitespace-nowrap rounded-drawn-chip border-[1.7px] border-pen-600 bg-transparent px-4 py-2 font-sans text-15 font-medium text-ink-1 transition-colors hover:border-pen-300 hover:bg-paper-high"
      >
        {/* The count is of DISTINCT pages, not the sum of what each crawler
            read: two tools reading the same one page is one page. */}
        Open the page list
        <span className="ml-2 font-hand text-14 lowercase text-ink-3">
          {urls.size === 1 ? '1 page' : `${urls.size} pages`}
        </span>
      </button>
    </Panel>
  );
}
