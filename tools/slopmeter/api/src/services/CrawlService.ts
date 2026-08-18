import type { TargetResolver } from '@lumioguard/api-core';
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
    return this.mapper.toResponse(report, this.clock());
  }
}
