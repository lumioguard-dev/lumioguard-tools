import { type CrawlResponse, confidenceFor } from '@lumioguard/shared';
import type { SiteReport, TierResolver } from '@lumioguard/slopmeter-core';
import type { ScreenshotProvider } from '../services/ScreenshotProvider.js';

export class SiteReportMapper {
  private readonly tierResolver: TierResolver;
  private readonly screenshots: ScreenshotProvider;

  public constructor(tierResolver: TierResolver, screenshots: ScreenshotProvider) {
    this.tierResolver = tierResolver;
    this.screenshots = screenshots;
  }

  public toResponse(report: SiteReport, fetchedAt: Date): CrawlResponse {
    return {
      entry: report.entry,
      pagesScanned: report.pagesScanned,
      confidence: confidenceFor(report.pagesScanned),
      maxDepthReached: report.maxDepthReached,
      requestedDepth: report.requestedDepth,
      requestedMaxPages: report.requestedMaxPages,
      site: {
        score: report.site.score,
        tier: report.site.tier,
        tierDescription: this.tierResolver.describe(report.site.score),
        headline: report.site.headline,
        method: report.site.method,
        homepageScore: report.site.homepageScore,
        medianPageScore: report.site.medianPageScore,
        meanPageScore: report.site.meanPageScore,
        worstPage: report.site.worstPage,
        hiddenSignals: report.site.hiddenSignals,
        hiddenWeight: report.site.hiddenWeight,
        hiddenDelta: report.site.hiddenDelta,
        uniqueSignals: report.site.uniqueSignals,
      },
      // Same boundary as a single-page scan: the rule's identity never leaves
      // the Worker, only what the visitor is told about it.
      signals: report.signals.map((signal, index) => ({
        id: `s${index}`,
        label: signal.label,
        weight: signal.weight,
        evidence: signal.evidence,
        pages: signal.pages,
        firstSeen: signal.firstSeen,
        onHomepage: signal.onHomepage,
      })),
      pages: report.pages.map((page) => ({ ...page })),
      errors: report.errors.map((error) => ({ ...error })),
      screenshotUrl: this.screenshots.urlFor(report.entry),
      // Filled in by the route once the reading is recorded; the mapper does no
      // I/O and cannot mint one.
      siteKey: null,
      fetchedAt: fetchedAt.toISOString(),
    };
  }
}
