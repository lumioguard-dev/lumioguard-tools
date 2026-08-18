import type { CrawlResponse } from '@lumioguard/shared';
import { Panel, PanelGrid, PanelHead } from '@lumioguard/ui';
import { tierInk } from '../../theme/tier.js';

/**
 * Everything about the crawl itself, on its own page.
 *
 * How the site scored and which pages were read are the same subject, and
 * neither is what a visitor came for. Together they were two full-width panels
 * of detail sitting between the verdict and the handoff; behind one control
 * they are a reference you open when you want it.
 */
export function PagesView({
  result,
  onBack,
}: {
  readonly result: CrawlResponse;
  readonly onBack: () => void;
}): JSX.Element {
  const { site } = result;

  return (
    <PanelGrid>
      <div className="col-span-6 lg:col-span-12">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-[9px] rounded-drawn-chip border-[1.6px] border-pen-700 bg-transparent px-4 py-[9px] font-sans text-15 font-medium text-ink-1 transition-colors hover:border-pen-600 hover:bg-paper-high"
        >
          <svg
            viewBox="0 0 22 15"
            className="h-[13px] w-[19px] fill-none stroke-current"
            aria-hidden="true"
            strokeWidth={1.8}
            strokeLinecap="round"
          >
            <path d="M21 7.4c-6-.6-12.6-.8-19.1-.4M7 2.2C5.1 4 3.3 5.8 1.5 7.6c1.8 1.9 3.6 3.7 5.6 5.4" />
          </svg>
          Back to the reading
        </button>
      </div>

      <Panel hand="d" span={12}>
        <PanelHead
          title="The site"
          kicker={`${result.pagesScanned} pages read · ${result.maxDepthReached} clicks deep`}
        />
        <p className="mt-3 max-w-[68ch] text-body text-ink-2">
          Front page{' '}
          <b className="font-semibold tabular-nums text-ink-1">
            {site.homepageScore ?? 'not read'}
          </b>
          , typical page{' '}
          <b className="font-semibold tabular-nums text-ink-1">{site.medianPageScore}</b>, worst{' '}
          <b className="font-semibold tabular-nums text-ink-1">
            {site.worstPage?.score ?? 'not read'}
          </b>
          . A site is scored on the worse of its front page and its typical page, so a large site
          cannot collect a bad verdict simply by having more pages to trip on. A tell found on
          twenty pages is not charged twenty times.
        </p>

        <div className="mt-7">
          <p className="pen-kicker">Every page read · worst first</p>
          <ul className="m-0 mt-3 list-none p-0">
            {[...result.pages]
              .sort((a, b) => b.score - a.score)
              .map((page) => (
                <li
                  key={page.url}
                  className="flex items-baseline gap-4 border-b border-pen-900 py-[9px] last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-body text-ink-1">{page.title ?? page.url}</p>
                    <p className="m-0 truncate text-caption text-ink-3">
                      {page.depth === 0 ? 'front page' : `${page.depth} clicks deep`} · {page.url}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-h4 font-bold tabular-nums"
                    style={{ color: tierInk(page.tier) }}
                  >
                    {page.score}
                  </span>
                </li>
              ))}
          </ul>
        </div>

        {result.errors.length > 0 && (
          <div className="mt-7">
            <p className="pen-kicker">Would not load</p>
            <ul className="m-0 mt-2 list-none space-y-[2px] p-0">
              {result.errors.map((error) => (
                <li key={error.url} className="text-caption text-ink-3">
                  <span className="text-ink-1">{error.url}</span>: {error.error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>
    </PanelGrid>
  );
}
