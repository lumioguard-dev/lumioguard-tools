import type { Finding } from '../domain/Finding.js';
import type { CrawlError, CrawledPage, SiteReport, SiteSignal } from '../domain/SiteReport.js';
import { SiteReport as SiteReportClass } from '../domain/SiteReport.js';
import { headlineFrom } from '../scoring/Headline.js';
import { TierResolver } from '../scoring/TierResolver.js';

export interface ScoredPage {
  readonly page: CrawledPage;
  readonly findings: readonly Finding[];
}

/** A true median: the average of the middle two on an even count. */
function median(sorted: readonly number[]): number {
  if (sorted.length === 0) return 0;
  const middle = sorted.length >> 1;
  if (sorted.length % 2 === 1) return sorted[middle] ?? 0;
  return Math.round(((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2);
}

export class SiteSummarizer {
  private readonly tierResolver: TierResolver;

  public constructor(tierResolver: TierResolver = new TierResolver()) {
    this.tierResolver = tierResolver;
  }

  /**
   * Signals that hide off the front door are surfaced — the most interesting
   * thing a crawl finds — but reported, never charged.
   */
  public summarize(
    entry: string,
    scored: readonly ScoredPage[],
    errors: readonly CrawlError[],
    options: { depth: number; maxPages: number },
  ): SiteReport {
    const union = new Map<string, SiteSignal & { weight: number }>();
    for (const { page, findings } of scored) {
      for (const finding of findings) {
        if (finding.weight === 0) continue;
        const existing = union.get(finding.ruleId);
        if (existing === undefined) {
          union.set(finding.ruleId, {
            ruleId: finding.ruleId,
            label: finding.label,
            weight: finding.weight,
            evidence: finding.evidence,
            phrase: finding.phrase,
            pages: 1,
            firstSeen: page.url,
            onHomepage: page.depth === 0,
          });
          continue;
        }
        union.set(finding.ruleId, {
          ...existing,
          pages: existing.pages + 1,
          onHomepage: existing.onHomepage || page.depth === 0,
          weight:
            Math.abs(finding.weight) > Math.abs(existing.weight) ? finding.weight : existing.weight,
        });
      }
    }

    const signals = [...union.values()].sort((a, b) => b.weight - a.weight);
    const pages = scored.map((s) => s.page);
    const homepage = pages.find((p) => p.depth === 0) ?? null;
    const worst = pages.length === 0 ? null : pages.reduce((a, b) => (b.score > a.score ? b : a));
    const scores = pages.map((p) => p.score).sort((a, b) => a - b);
    const mid = median(scores);
    const mean =
      scores.length === 0 ? 0 : Math.round(scores.reduce((a, s) => a + s, 0) / scores.length);

    const value = Math.max(0, Math.min(100, Math.max(homepage?.score ?? 0, mid)));
    const hidden = signals.filter((s) => s.weight > 0 && !s.onHomepage);

    return new SiteReportClass({
      entry,
      maxDepthReached: pages.reduce((max, p) => Math.max(max, p.depth), 0),
      requestedDepth: options.depth,
      requestedMaxPages: options.maxPages,
      site: {
        score: value,
        tier: this.tierResolver.resolve(value),
        method: 'max(homepage, median page); hidden signals reported, not charged',
        // Built from the site's own heaviest tells, not the homepage's: a
        // crawl exists to find what the front page was hiding.
        headline: headlineFrom(signals),
        homepageScore: homepage?.score ?? null,
        medianPageScore: mid,
        meanPageScore: mean,
        worstPage: worst === null ? null : { url: worst.url, score: worst.score, tier: worst.tier },
        hiddenSignals: hidden.length,
        hiddenWeight: hidden.reduce((total, s) => total + s.weight, 0),
        hiddenDelta: homepage === null ? null : value - homepage.score,
        uniqueSignals: signals.filter((s) => s.weight > 0).length,
      },
      signals,
      pages,
      errors,
    });
  }
}
