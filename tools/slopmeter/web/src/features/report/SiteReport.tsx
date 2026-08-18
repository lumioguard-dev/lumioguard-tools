import type { CrawlResponse, FindingDto } from '@lumioguard/shared';
import { MarkScored, Panel, PanelHead } from '@lumioguard/ui';

import { TellList } from './TellList.js';

function toFindings(result: CrawlResponse): FindingDto[] {
  return result.signals.map((signal) => ({
    id: signal.id,
    label: signal.label,
    weight: signal.weight,
    evidence:
      signal.evidence === null
        ? `on ${signal.pages} of the pages read`
        : `${signal.evidence}, on ${signal.pages} of the pages read`,
  }));
}

/**
 * Everything under the reading: the full charge sheet, the way into the crawl
 * detail, and the handoff.
 *
 * The verdict itself is mounted a level up and stays mounted across the wait,
 * which is what lets the needle carry from hunting to settled without a cut.
 */
export function SiteReport({
  result,
  onOpenPages,
}: {
  readonly result: CrawlResponse;
  readonly onOpenPages: () => void;
}): JSX.Element {
  const findings = toFindings(result);

  return (
    <>
      <Panel hand="a" span={12} className="settles-in">
        <PanelHead
          title="Report card"
          kicker={`Scored · moves the number · ${findings.length} signal${
            findings.length === 1 ? '' : 's'
          }`}
          mark={<MarkScored />}
        />
        {findings.length === 0 ? (
          <p className="mt-4 text-body text-ink-2">Nothing stock fired anywhere.</p>
        ) : (
          <TellList findings={findings} />
        )}
      </Panel>

      <Panel
        hand="d"
        span={12}
        className="settles-in settles-in--late !flex-row !flex-wrap !items-center !gap-6 !px-6 !py-[13px]"
      >
        <div className="min-w-0 flex-[1_1_22rem]">
          <p className="pen-title !text-17 !leading-[1.25]">Every page it read</p>
          <p className="mt-[1px] text-13 leading-[1.45] text-ink-2">
            How the {result.pagesScanned} pages scored, how the roll-up was reached, and anything
            that would not load.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenPages}
          className="whitespace-nowrap rounded-drawn-chip border-[1.7px] border-pen-600 bg-transparent px-4 py-2 font-sans text-15 font-medium text-ink-1 transition-colors hover:border-pen-300 hover:bg-paper-high"
        >
          Open the page list
        </button>
      </Panel>
    </>
  );
}
