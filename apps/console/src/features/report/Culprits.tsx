import { MarkScored, Panel, PanelHead } from '@lumioguard/ui';
import type { Reading } from '../scan/useReadings.js';

const SHOWN = 6;

/**
 * The worst of everything, across every reading.
 *
 * Ranked by what each finding COST its tool's score, which is the one thing
 * findings from three unrelated engines have in common: they are all points on
 * the same 0-100 scale. Nothing else about them compares. Inventing a severity
 * word that spanned a leaked key, a stock hero image and a page a crawler
 * cannot read would have been a fourth vocabulary answering to nothing.
 *
 * The tool is named on every line, because a reader who wants the detail needs
 * to know which section below to look in, and because a bare list of six
 * problems reads as one engine's opinion rather than three.
 */
export function Culprits({ readings }: { readonly readings: readonly Reading[] }): JSX.Element {
  const all = readings
    .flatMap((reading) =>
      (reading.outcome?.culprits ?? []).map((culprit) => ({
        ...culprit,
        tool: reading.tool.label,
        ink: reading.outcome?.ink ?? '',
      })),
    )
    .sort((a, b) => b.cost - a.cost);

  const top = all.slice(0, SHOWN);

  return (
    <Panel hand="b" span={5}>
      <PanelHead title="The culprits" mark={<MarkScored />} />

      {top.length === 0 ? (
        <p className="mt-4 text-body text-ink-2">Nothing was charged by any reading.</p>
      ) : (
        <ol className="m-0 mt-4 list-none p-0">
          {top.map((culprit) => (
            <li
              key={`${culprit.tool}-${culprit.id}`}
              className="flex items-baseline gap-3 border-b border-pen-900 py-[10px] last:border-b-0"
            >
              <span
                className="shrink-0 font-hand text-20 tabular-nums"
                style={{ color: culprit.ink }}
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

      {all.length > top.length && (
        <p className="mt-auto pt-5 text-13 leading-[1.5] text-ink-2">
          {all.length - top.length} more are listed under each reading below.
        </p>
      )}
    </Panel>
  );
}
