import { type SiteReport, weightOf } from '@lumioguard/citecheck-core';
import type {
  AgentPostureDto,
  CitationCrawlResponse,
  CitationSignalDto,
  CitationSourcesDto,
} from '@lumioguard/shared';

export interface CrawlInputs {
  readonly report: SiteReport;
  readonly agents: readonly AgentPostureDto[];
  readonly sources: CitationSourcesDto;
  readonly siteKey: string | null;
  readonly fetchedAt: string;
}

/**
 * Field by field, never a spread of the domain object: a spread would carry each
 * signal's internal `code` and its `fix` across the boundary, and would forward
 * whatever the engine gains next without anyone deciding it should be public.
 */
export function toCrawlResponse(inputs: CrawlInputs): CitationCrawlResponse {
  const { report } = inputs;

  const signals: CitationSignalDto[] = report.signals.map((signal, index) => ({
    id: `s${index}`,
    impact: signal.impact,
    weight: weightOf(signal.impact),
    area: signal.area,
    title: signal.title,
    detail: signal.detail,
    evidence: signal.evidence,
    pages: signal.pages,
    firstSeen: signal.firstSeen,
    onEntry: signal.onEntry,
  }));

  return {
    entry: report.entry,
    host: report.host,
    pagesScanned: report.pagesScanned,
    maxDepthReached: report.maxDepthReached,
    requestedDepth: report.requestedDepth,
    requestedMaxPages: report.requestedMaxPages,
    site: {
      score: report.site.score,
      tier: report.site.tier,
      tierDescription: report.site.tierDescription,
      headline: report.site.headline,
      method: report.site.method,
      entryScore: report.site.entryScore,
      medianPageScore: report.site.medianPageScore,
      worstPage: report.site.worstPage,
      hiddenFindings: report.site.hiddenFindings,
      hiddenDelta: report.site.hiddenDelta,
      uniqueFindings: report.site.uniqueFindings,
    },
    signals,
    pages: report.pages.map((page) => ({
      url: page.url,
      depth: page.depth,
      score: page.score,
      tier: page.tier,
      title: page.title,
      findingCount: page.findingCount,
    })),
    errors: report.errors.map((error) => ({ url: error.url, error: error.error })),
    agents: [...inputs.agents],
    profile: report.profile,
    sources: inputs.sources,
    siteKey: inputs.siteKey,
    fetchedAt: inputs.fetchedAt,
  };
}
