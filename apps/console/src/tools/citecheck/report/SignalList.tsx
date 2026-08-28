import type { CitationSignalDto, CiteArea, Impact } from '@lumioguard/shared';
import { Panel, PanelHead } from '@lumioguard/ui';
import type { ReactNode } from 'react';
import { impactInk } from '../theme.js';

/**
 * "Not found" rather than "Missing": the report has no business calling a thing
 * missing that the page never owed anyone.
 */
const IMPACT_LABEL: Record<Impact, string> = {
  blocker: 'Blocker',
  major: 'Major',
  minor: 'Minor',
  absent: 'Not found',
};

/** The report's own words for the area, not the enum's. */
const AREA_LABEL: Record<CiteArea, string> = {
  access: 'Access',
  structured: 'Claims',
  document: 'Document',
  answerability: 'Answerability',
};

function ImpactChip({ impact }: { readonly impact: Impact }): JSX.Element {
  const tint = impactInk(impact);
  return (
    <span
      className="shrink-0 rounded-drawn-chip border-2 px-[10px] py-[3px] font-sans text-12 font-semibold uppercase leading-none tracking-wide"
      style={{ color: tint, borderColor: tint }}
    >
      {IMPACT_LABEL[impact]}
    </span>
  );
}

/**
 * "Behind the front door" is the whole reason this tool crawls: a finding that
 * never reaches the homepage is one the owner has never seen.
 */
function Reach({ signal }: { readonly signal: CitationSignalDto }): JSX.Element | null {
  if (signal.pages <= 1 && signal.onEntry) return null;

  const pages = signal.pages === 1 ? 'one page' : `${signal.pages} pages`;
  return (
    <p className="m-0 font-hand text-14 lowercase tracking-wide text-ink-3">
      {signal.onEntry ? `on ${pages}` : `on ${pages}, none of them the front door`}
    </p>
  );
}

function SignalCard({ signal }: { readonly signal: CitationSignalDto }): JSX.Element {
  return (
    <li className="flex flex-col gap-[9px] border-t-2 border-dashed border-pen-700/40 pt-5 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <ImpactChip impact={signal.impact} />
        <h3 className="m-0 font-hand text-20 leading-tight text-ink-1">{signal.title}</h3>
        <span className="font-hand text-14 lowercase tracking-wide text-ink-3">
          {AREA_LABEL[signal.area]}
        </span>
      </div>

      <p className="m-0 max-w-[62ch] text-body text-ink-2">{signal.detail}</p>

      {signal.evidence !== null && (
        <p className="m-0 max-w-[62ch] break-words rounded-drawn-chip bg-paper-high px-[13px] py-[9px] font-mono text-caption text-ink-2">
          {signal.evidence}
        </p>
      )}

      <Reach signal={signal} />
    </li>
  );
}

/**
 * Nothing is re-ranked here: the meter's score and this list come from one ordered
 * set upstream, so the number and the list can never disagree.
 */
export function SignalList({
  signals,
  pagesScanned,
  verdict,
}: {
  readonly signals: readonly CitationSignalDto[];
  readonly pagesScanned: number;
  /** This reading's own score and tier, drawn at the head of its section. */
  readonly verdict: ReactNode;
}): JSX.Element {
  const pages = pagesScanned === 1 ? 'one page' : `${pagesScanned} pages`;
  // Counts what COSTS something: a `Not found` flag weighs nothing, so counting it
  // would put a number in front of "in the way" that the score disagrees with.
  const inTheWay = signals.filter((signal) => signal.impact !== 'absent').length;

  if (signals.length === 0) {
    return (
      <Panel hand="a" span={12}>
        <PanelHead title="Nothing stops it being quoted" trailing={verdict} />
        <p className="mt-3 max-w-[62ch] text-body text-ink-2">
          Citecheck read {pages} and found nothing standing between them and being quoted. That is
          the checks it runs today, not a promise anything will cite you: what gets quoted also
          depends on whether the page says something worth quoting.
        </p>
      </Panel>
    );
  }

  return (
    <Panel hand="b" span={12}>
      {/* Named for what it costs the reader: on a page of three readings, a title
          about its shape said nothing about which one it belonged to. */}
      <PanelHead
        title={
          inTheWay === 0
            ? 'Nothing stops it being quoted'
            : `What stops it being quoted (${inTheWay})`
        }
        trailing={verdict}
      />
      <ul className="mt-5 flex list-none flex-col gap-5 p-0">
        {signals.map((signal) => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
      </ul>
    </Panel>
  );
}
