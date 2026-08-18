import type { FindingDto } from '@lumioguard/shared';
import { weightInk } from '../../theme/tier.js';

interface TellListProps {
  readonly findings: readonly FindingDto[];
  /** Uncounted observations show no mark — the absence is the point. */
  readonly showWeights?: boolean;
}

/**
 * One line per observation: what was found, and the evidence that keyed it. The
 * evidence sits on the line rather than behind a disclosure — a verdict a
 * reader cannot check is an opinion.
 *
 * The weight is the magnitude. A drawn bar beside it restated the same number
 * in a second form and took a whole column to do it, which on a list this long
 * read as a chart nobody asked for.
 */
export function TellList({ findings, showWeights = true }: TellListProps): JSX.Element {
  return (
    <ul className="mt-4">
      {findings.map((finding, i) => (
        <li
          key={finding.id}
          className="grid grid-cols-[minmax(0,1fr)_4rem] items-center gap-[10px] border-b border-pen-900/40 py-[17px] last:border-b-0 md:grid-cols-[1.9rem_minmax(0,1fr)_minmax(0,1fr)_4rem] md:gap-[13px]"
        >
          <span className="hidden text-13 tabular-nums text-ink-3 md:block">
            {String(i + 1).padStart(2, '0')}
          </span>

          <p className="m-0 min-w-0 font-semibold text-ink-1">{finding.label}</p>

          {finding.evidence !== null ? (
            <p className="col-span-2 m-0 min-w-0 break-words text-13 text-ink-2 md:col-span-1">
              {finding.evidence}
            </p>
          ) : (
            <span className="hidden md:block" />
          )}

          {showWeights ? (
            <span
              className="justify-self-end text-right font-bold tabular-nums"
              style={{ color: weightInk(finding.weight) }}
            >
              {finding.weight > 0 ? `+${finding.weight}` : finding.weight}
            </span>
          ) : (
            <span className="justify-self-end text-right font-semibold tabular-nums text-ink-3">
              0
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
