import {
  CITATION_MAX,
  type CitationTier,
  type PageProfileDto,
  citationBandFor,
} from '@lumioguard/shared';
import type { PageResult } from '../CiteAnalyzer.js';
import type { CiteFinding } from '../domain/CiteFinding.js';
import { orderFindings } from '../domain/CiteFinding.js';
import { scoreCitation } from '../scoring/CiteScore.js';
import { headlineFor } from '../scoring/headline.js';
import { type BrokenLink, checkBrokenLinks, checkDuplicates } from './duplicates.js';

export interface ReadPage {
  readonly depth: number;
  readonly result: PageResult;
}

export interface CrawledPage {
  readonly url: string;
  readonly depth: number;
  readonly score: number;
  readonly tier: CitationTier;
  readonly title: string | null;
  readonly findingCount: number;
}

/** A finding rolled up across every page of the crawl that it fired on. */
export interface CrawlSignal extends CiteFinding {
  readonly pages: number;
  readonly firstSeen: string;
  /** False when this only ever fired behind the entry page. */
  readonly onEntry: boolean;
}

export interface CrawlError {
  readonly url: string;
  readonly error: string;
  /** The upstream status, where the request reached a server. */
  readonly status: number | null;
}

export interface SiteVerdict {
  readonly score: number;
  readonly tier: CitationTier;
  readonly tierDescription: string;
  readonly headline: string | null;
  readonly method: string;
  readonly entryScore: number | null;
  readonly medianPageScore: number;
  readonly worstPage: {
    readonly url: string;
    readonly score: number;
    readonly tier: CitationTier;
  } | null;
  readonly hiddenFindings: number;
  readonly hiddenDelta: number | null;
  readonly uniqueFindings: number;
}

export interface SiteReport {
  readonly entry: string;
  readonly host: string;
  readonly pagesScanned: number;
  readonly maxDepthReached: number;
  readonly requestedDepth: number;
  readonly requestedMaxPages: number;
  readonly site: SiteVerdict;
  readonly signals: readonly CrawlSignal[];
  readonly pages: readonly CrawledPage[];
  readonly errors: readonly CrawlError[];
  readonly profile: PageProfileDto;
}

/**
 * Said in the response so the number can be argued with. A site score that is
 * an unexplained average is one nobody can act on: it moves and no page moved.
 */
const METHOD = 'the worst of the entry page, the median page and the site-wide findings';

/** A true median: the average of the middle two on an even count. */
function median(sorted: readonly number[]): number {
  if (sorted.length === 0) return 0;
  const middle = sorted.length >> 1;
  if (sorted.length % 2 === 1) return sorted[middle] ?? 0;
  return Math.round(((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2);
}

const FALLBACK_PROFILE: PageProfileDto = Object.freeze({
  rendering: 'served',
  declaredType: null,
  generator: null,
});

export class SiteSummarizer {
  /**
   * Every page's findings unioned by code, with the site's own folded in once.
   *
   * The site-wide findings (no sitemap, robots.txt contradicting llms.txt, a
   * title repeated across the crawl) are true of the site rather than of each
   * page. Listing them per page would report one missing sitemap as many times
   * as pages happened to be read.
   */
  public summarize(
    entry: string,
    read: readonly ReadPage[],
    siteFindings: readonly CiteFinding[],
    errors: readonly CrawlError[],
    options: { depth: number; maxPages: number },
  ): SiteReport {
    const union = new Map<string, CrawlSignal>();
    const pages: CrawledPage[] = [];

    for (const { depth, result } of read) {
      const ordered = orderFindings(result.findings);
      const scored = scoreCitation(ordered);
      pages.push({
        url: result.url,
        depth,
        score: scored.score,
        tier: scored.tier,
        title: result.title,
        findingCount: ordered.filter((item) => item.impact !== 'absent').length,
      });

      for (const item of ordered) {
        const existing = union.get(item.code);
        if (existing === undefined) {
          union.set(item.code, { ...item, pages: 1, firstSeen: result.url, onEntry: depth === 0 });
          continue;
        }
        union.set(item.code, {
          ...existing,
          pages: existing.pages + 1,
          onEntry: existing.onEntry || depth === 0,
        });
      }
    }

    /**
     * The checks that can only be made by reading pages AGAINST each other.
     * They are the reason a crawl beats a page scan, and they cannot exist
     * until every page has been read.
     */
    const crossPage: CiteFinding[] = [
      ...checkDuplicates(
        read.map(({ result }) => ({
          url: result.url,
          title: result.title,
          description: result.description,
        })),
      ),
      ...checkBrokenLinks(errors as readonly BrokenLink[]),
    ];

    for (const item of [...siteFindings, ...crossPage]) {
      if (union.has(item.code)) continue;
      union.set(item.code, { ...item, pages: pages.length, firstSeen: entry, onEntry: true });
    }

    const signals = orderFindings([...union.values()]);
    const entryPage = pages.find((page) => page.depth === 0) ?? null;
    // Worst is the LOWEST now: the scale runs higher-is-better.
    const worst = pages.length === 0 ? null : pages.reduce((a, b) => (b.score < a.score ? b : a));

    /**
     * The worst of three per axis, not a mean of anything.
     *
     * A site whose front door is clean and whose articles are shells is not
     * half fine, so the entry page cannot carry the verdict alone and neither
     * can an average that dilutes it. The site-wide findings are scored on
     * their own rather than unioned into the page findings: unioned, a deeper
     * crawl finds more distinct codes and scores worse for having looked
     * harder, which would make the depth setting part of the verdict.
     */
    const siteOnly = scoreCitation([...siteFindings, ...crossPage]);

    const scores = pages.map((page) => page.score).sort((a, b) => a - b);
    const mid = median(scores);
    const value = Math.min(entryPage?.score ?? CITATION_MAX, mid, siteOnly.score);
    const band = citationBandFor(value);
    // Flags are excluded from both counts: neither is a finding. "3 findings
    // behind the front door" has to mean three things that cost something, or
    // the number that justifies crawling at all is inflated by absences.
    const scored = signals.filter((signal) => signal.impact !== 'absent');
    const hidden = scored.filter((signal) => !signal.onEntry);

    return {
      entry,
      host: read[0]?.result.host ?? hostOf(entry),
      pagesScanned: pages.length,
      maxDepthReached: pages.reduce((max, page) => Math.max(max, page.depth), 0),
      requestedDepth: options.depth,
      requestedMaxPages: options.maxPages,
      site: {
        score: value,
        tier: band.tier,
        tierDescription: band.description,
        // Built from the site's own worst finding, not the entry page's: a
        // crawl exists to find what the front door was hiding.
        headline: headlineFor(signals),
        method: METHOD,
        entryScore: entryPage?.score ?? null,
        medianPageScore: mid,
        worstPage: worst === null ? null : { url: worst.url, score: worst.score, tier: worst.tier },
        hiddenFindings: hidden.length,
        // How much WORSE the site score is than the entry page alone, so it
        // stays a positive number for a crawl that found something behind the
        // front door. The subtraction flips with the scale.
        hiddenDelta: entryPage === null ? null : entryPage.score - value,
        uniqueFindings: scored.length,
      },
      signals,
      pages,
      errors,
      profile: read[0]?.result.profile ?? FALLBACK_PROFILE,
    };
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}
