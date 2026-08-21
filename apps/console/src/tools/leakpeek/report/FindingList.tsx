import type { DetectedStackDto, ExposureFindingDto, Severity } from '@lumioguard/shared';
import { Panel } from '@lumioguard/ui';
import type { ReactNode } from 'react';
import { severityInk } from '../theme.js';

import { StackSlip } from './StackSlip.js';

/**
 * The panel header for a reading: what was found on the left, the platforms
 * behind it on the right.
 */
/**
 * The heading, this reading's verdict, and what the site is built on.
 *
 * The stack sits UNDER the title rather than opposite it: the right of the
 * heading is where every section now carries its own score, and two things
 * competing for that side left neither of them readable.
 */
function ExposureHeader({
  title,
  stack,
  verdict,
}: {
  readonly title: string;
  readonly stack: DetectedStackDto;
  readonly verdict: ReactNode;
}): JSX.Element {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
      <div className="flex min-w-0 flex-col gap-3">
        <p className="pen-title">{title}</p>
        <StackSlip stack={stack} />
      </div>
      {verdict}
    </div>
  );
}

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

function SeverityChip({ severity }: { readonly severity: Severity }): JSX.Element {
  const ink = severityInk(severity);
  return (
    <span
      className="shrink-0 rounded-drawn-chip border-2 px-[10px] py-[3px] font-sans text-12 font-semibold uppercase leading-none tracking-wide"
      style={{ color: ink, borderColor: ink }}
    >
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

function FindingCard({ finding }: { readonly finding: ExposureFindingDto }): JSX.Element {
  return (
    <li className="flex flex-col gap-[9px] border-t-2 border-dashed border-pen-700/40 pt-5 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <SeverityChip severity={finding.severity} />
        <h3 className="m-0 font-hand text-20 leading-tight text-ink-1">{finding.title}</h3>
      </div>

      <p className="m-0 max-w-[62ch] text-body text-ink-2">{finding.detail}</p>

      {finding.evidence !== null && (
        <p className="m-0 max-w-[62ch] break-words rounded-drawn-chip bg-paper-high px-[13px] py-[9px] font-mono text-caption text-ink-2">
          {finding.evidence}
        </p>
      )}
    </li>
  );
}

/**
 * The findings, worst first, in the order the API already sorted them. Nothing
 * is re-ranked here: the meter's score and this list are derived from the same
 * ordered set upstream, so the number and the list can never disagree.
 */
export function FindingList({
  findings,
  backendProbed,
  stack,
  verdict,
}: {
  readonly findings: readonly ExposureFindingDto[];
  readonly backendProbed: boolean;
  readonly stack: DetectedStackDto;
  /** This reading's own score and tier, drawn at the head of its section. */
  readonly verdict: ReactNode;
}): JSX.Element {
  if (findings.length === 0) {
    return (
      <Panel hand="a" span={12}>
        <ExposureHeader title="Nothing leaked" stack={stack} verdict={verdict} />
        {/* Names only what was actually read. Saying "and its backend"
            unconditionally credited a check that never ran on the many sites
            that point at no backend at all. */}
        <p className="mt-3 max-w-[60ch] text-body text-ink-2">
          {backendProbed
            ? 'The scanner read the page, its scripts and its backend, and found nothing exposed.'
            : 'The scanner read the page and its scripts and found nothing exposed. It found no backend to read, so nothing here says the data is safe.'}{' '}
          That is the checks Leakpeek runs today: not a guarantee the whole app is safe, only that
          these did not fire.
        </p>
      </Panel>
    );
  }

  return (
    <Panel hand="b" span={12}>
      <ExposureHeader
        title={`What is exposed (${findings.length})`}
        stack={stack}
        verdict={verdict}
      />
      <ul className="mt-5 flex list-none flex-col gap-5 p-0">
        {findings.map((finding) => (
          <FindingCard key={finding.id} finding={finding} />
        ))}
      </ul>
    </Panel>
  );
}
