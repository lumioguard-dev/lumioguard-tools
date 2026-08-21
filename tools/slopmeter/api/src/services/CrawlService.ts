import { PageFetchError, type TargetResolver } from '@lumioguard/api-core';
import type { CrawlResponse } from '@lumioguard/shared';
import type { SiteCrawler } from '@lumioguard/slopmeter-core';
import type { SiteReportMapper } from '../mappers/SiteReportMapper.js';

/** The whole-site use case: breadth across a level, depth through levels. */
export class CrawlService {
  private readonly resolver: TargetResolver;
  private readonly crawler: SiteCrawler;
  private readonly mapper: SiteReportMapper;
  private readonly clock: () => Date;

  public constructor(dependencies: {
    resolver: TargetResolver;
    crawler: SiteCrawler;
    mapper: SiteReportMapper;
    clock?: () => Date;
  }) {
    this.resolver = dependencies.resolver;
    this.crawler = dependencies.crawler;
    this.mapper = dependencies.mapper;
    this.clock = dependencies.clock ?? ((): Date => new Date());
  }

  public async crawlSite(
    rawUrl: string,
    options: { depth?: number; maxPages?: number } = {},
  ): Promise<CrawlResponse> {
    const target = this.resolver.resolve(rawUrl);
    const report = await this.crawler.crawl(target.toString(), options);

    /**
     * A crawl that read nothing is a FAILED READING, not a clean one.
     *
     * The crawler collects a page it cannot load into `errors` rather than
     * throwing, which is right when fourteen of fifteen pages loaded. When none
     * did, the score is computed over no evidence and comes back 0,
     * "Hand-Crafted: almost nothing here comes out of a box", about a site
     * nothing was able to read. Worse in the console than alone: 0 is the best
     * possible score, so a site behind a bot challenge would set a consolidated
     * verdict of Clean while every other reading failed.
     */
    if (report.pagesScanned === 0) {
      // Says what happened, not why. A status the site did return is worth
      // repeating; anything else is a runtime reference id, which is true and
      // useless to whoever mistyped a domain.
      const upstream = report.errors[0]?.error ?? '';
      throw new PageFetchError(
        'upstream_error',
        upstream.startsWith('Upstream responded')
          ? `That address could not be read: ${upstream.toLowerCase()}`
          : 'That address could not be read. Check the spelling, and that the site is up.',
      );
    }

    return this.mapper.toResponse(report, this.clock());
  }
}
