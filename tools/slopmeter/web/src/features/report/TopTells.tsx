import type { CrawlResponse } from '@lumioguard/shared';
import { MarkScored, Panel, PanelHead } from '@lumioguard/ui';
import { weightInk } from '../../theme/tier.js';

const SHOWN = 4;

/** One ruled line, drawn rather than a grey block. */
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

/** The panel while the read is still running. */
function Ruling(): JSX.Element {
  return (
    <ol className="m-0 mt-4 list-none p-0" aria-hidden="true">
      {[0, 1, 2, 3].map((row) => (
        <li key={row} className="border-b border-pen-900 py-[10px] last:border-b-0">
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
 * The count of tells the front page never showed is one sentence here rather
 * than the panel it used to have: it is a fact about the crawl, not a
 * finding of its own, and it earned a paragraph it could not fill.
 */
export function TopTells({ result }: { readonly result: CrawlResponse | null }): JSX.Element {
  /* The title is the whole heading. `Heaviest first` described the sort order of
     four lines whose numbers are printed down the left edge in descending order,
     and the count it carried is the report card's own subject. */
  const head = <PanelHead title="The culprits" mark={<MarkScored />} />;

  if (result === null) {
    return (
      <Panel hand="b" span={5}>
        {head}
        <Ruling />
      </Panel>
    );
  }

  const charged = result.signals
    .filter((signal) => signal.weight > 0)
    .sort((a, b) => b.weight - a.weight);
  const top = charged.slice(0, SHOWN);
  const buried = charged.filter((signal) => !signal.onHomepage).length;
  /** What a homepage-only read would have reported instead of the site score. */
  const lighter = result.site.hiddenDelta ?? 0;

  return (
    <Panel hand="b" span={5}>
      {head}

      {top.length === 0 ? (
        <p className="mt-4 text-body text-ink-2">Nothing stock fired anywhere.</p>
      ) : (
        <ol className="m-0 mt-4 list-none p-0">
          {top.map((signal) => (
            <li
              key={signal.id}
              className="flex items-baseline gap-3 border-b border-pen-900 py-[10px] last:border-b-0"
            >
              <span
                className="shrink-0 font-hand text-20 tabular-nums"
                style={{ color: weightInk(signal.weight) }}
              >
                +{signal.weight}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-body leading-[1.35] text-ink-1">{signal.label}</span>
                <span className="mt-[2px] block text-caption text-ink-3">
                  on {signal.pages} of {result.pagesScanned} pages
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}

      {buried > 0 && (
        <p className="mt-auto pt-5 text-13 leading-[1.5] text-ink-2">
          <b className="font-semibold text-ink-1">
            {buried} of these never show on the front page.
          </b>{' '}
          {lighter > 0
            ? `Reading only the homepage would have scored this site ${lighter} points cleaner.`
            : `Following the links is what turned ${buried === 1 ? 'it' : 'them'} up.`}
        </p>
      )}
    </Panel>
  );
}
