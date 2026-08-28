import { TargetResolver, assertPagesRead } from '@lumioguard/api-core';
import { SiteCrawler, analyzeSite } from '@lumioguard/citecheck-core';
import type { CitationCrawlResponse } from '@lumioguard/shared';
import { type CrawlInputs, toCrawlResponse } from '../mappers/SiteReportMapper.js';
import { PageFetcher } from './PageFetcher.js';
import { PageLoaderAdapter } from './PageLoaderAdapter.js';
import { SiteContextReader } from './SiteContextReader.js';

/**
 * The site context is read ONCE and handed to every page: robots.txt and the
 * sitemap govern the whole host, so re-reading them per page would be one
 * identical request per page to somebody else's server for the one answer.
 */
export class CrawlService {
  private readonly resolver: TargetResolver;
  private readonly fetcher: PageFetcher;
  private readonly siteReader: SiteContextReader;
  private readonly clock: () => Date;

  public constructor(
    deps: {
      resolver?: TargetResolver;
      fetcher?: PageFetcher;
      siteReader?: SiteContextReader;
      clock?: () => Date;
    } = {},
  ) {
    this.resolver = deps.resolver ?? new TargetResolver();
    this.fetcher = deps.fetcher ?? new PageFetcher();
    this.siteReader = deps.siteReader ?? new SiteContextReader(this.fetcher);
    this.clock = deps.clock ?? (() => new Date());
  }

  public async crawlSite(
    rawUrl: string,
    options: { depth?: number; maxPages?: number } = {},
  ): Promise<CitationCrawlResponse> {
    const target = this.resolver.resolve(rawUrl);

    const probe = await this.fetcher.probeAsAgent(target);
    const site = await this.siteReader.read(target, probe);
    const siteFindings = analyzeSite(site.context.wellKnown);

    const crawler = new SiteCrawler(new PageLoaderAdapter(this.fetcher, this.resolver));
    const report = await crawler.crawl(target.toString(), site.context, siteFindings, options);

    assertPagesRead(report.pagesScanned, report.errors);

    const inputs: CrawlInputs = {
      report,
      agents: site.context.wellKnown.postures,
      sources: site.sources,
      siteKey: null,
      fetchedAt: this.clock().toISOString(),
    };

    return toCrawlResponse(inputs);
  }
}
