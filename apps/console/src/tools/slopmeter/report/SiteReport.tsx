import type { CrawlResponse, FindingDto } from '@lumioguard/shared';
import { MarkScored, Panel, PanelHead } from '@lumioguard/ui';
import type { ReactNode } from 'react';

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
  verdict,
}: {
  readonly result: CrawlResponse;
  readonly verdict: ReactNode;
}): JSX.Element {
  const findings = toFindings(result);

  return (
    <Panel hand="a" span={12} className="settles-in">
      {/* Says the word. "Report card" named its form and "What came out of a
          template" talked around the subject; this tool is called Slopmeter and
          the thing it measures has a name. */}
      <PanelHead title="Where the slop is" mark={<MarkScored />} trailing={verdict} />
      {findings.length === 0 ? (
        <p className="mt-4 text-body text-ink-2">Nothing stock fired anywhere.</p>
      ) : (
        <TellList findings={findings} />
      )}
    </Panel>
  );
}
