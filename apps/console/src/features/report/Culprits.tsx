import { MarkScored, Panel, PanelHead } from '@lumioguard/ui';
import { costInk } from '../../theme/cost.js';
import type { Reading } from '../scan/useReadings.js';

const SHOWN = 6;

function Rule({ className }: { readonly className: string }): JSX.Element {
  return (
    <svg
      viewBox="0 0 200 6"
      preserveAspectRatio="none"
      className={`h-[6px] fill-none stroke-pen-700 ${className}`}
      aria-hidden="true"
      strokeLinecap="round"
      strokeWidth={1.5}
    >
      <path vectorEffect="non-scaling-stroke" d="M2 3.4C52 2.2 102 4.2 152 3c16-.4 32 .6 46 .2" />
    </svg>
  );
}

const RULES = Array.from({ length: SHOWN }, (_, row) => ({ id: `rule-${row}`, row }));

/** SHOWN rows, so nothing below moves when the real list lands. */
function Ruling(): JSX.Element {
  return (
    <ol className="m-0 mt-4 list-none p-0" aria-hidden="true">
      {RULES.map(({ id, row }) => (
        <li key={id} className="border-b border-pen-900 py-[10px] last:border-b-0">
          <span
            className="ruling flex items-baseline gap-3"
            style={{ animationDelay: `${row * 150}ms` }}
          >
            <Rule className="w-[30px] shrink-0" />
            <span className="min-w-0 flex-1">
              <Rule className={`block ${row % 2 === 0 ? 'w-full' : 'w-[86%]'}`} />
              <Rule className={`mt-[17px] block ${row % 2 === 0 ? 'w-[48%]' : 'w-[57%]'}`} />
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Ranked by what each finding COST its tool's score, the one thing findings from
 * three unrelated engines share. A severity word spanning a leaked key, a stock
 * hero and an unreadable page would be a fourth vocabulary answering to nothing.
 */
export function Culprits({
  readings,
  pending,
}: {
  readonly readings: readonly Reading[];
  /** The panel rules rather than ranks: a partial order is one about to change. */
  readonly pending: boolean;
}): JSX.Element {
  const all = readings
    .flatMap((reading) =>
      (reading.outcome?.culprits ?? []).map((culprit) => ({
        ...culprit,
        // Both: the id keys the row, because two readings may share a label and
        // their opaque finding ids both start at f0.
        toolId: reading.tool.id,
        tool: reading.tool.label,
      })),
    )
    .sort((a, b) => b.cost - a.cost);

  const top = all.slice(0, SHOWN);

  return (
    <Panel hand="b" span={5}>
      <PanelHead title="The culprits" mark={<MarkScored />} />

      {pending ? (
        <Ruling />
      ) : top.length === 0 ? (
        <p className="mt-4 text-body text-ink-2">Didn't find any obvious giveaways.</p>
      ) : (
        <ol className="m-0 mt-4 list-none p-0">
          {top.map((culprit) => (
            <li
              key={`${culprit.toolId}-${culprit.id}`}
              className="flex items-baseline gap-3 border-b border-pen-900 py-[10px] last:border-b-0"
            >
              <span
                className="shrink-0 font-hand text-20 tabular-nums"
                style={{ color: costInk(culprit.cost) }}
              >
                {/* Subtracted, not added: higher is better, so what a finding
                    cost is what it took off the score. */}
                -{culprit.cost}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-body leading-[1.35] text-ink-1">{culprit.title}</span>
                <span className="mt-[2px] block text-caption text-ink-3">
                  {culprit.tool}
                  {culprit.note === null ? '' : ` · ${culprit.note}`}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}

      {!pending && all.length > top.length && (
        <p className="mt-auto pt-5 text-13 leading-[1.5] text-ink-2">
          {all.length - top.length} more are listed under each reading below.
        </p>
      )}
    </Panel>
  );
}
