import { PageFetchError, TargetResolver } from '@lumioguard/api-core';
import { SiteCrawler, analyzeSite } from '@lumioguard/citecheck-core';
import type { CitationCrawlResponse } from '@lumioguard/shared';
import { type CrawlInputs, toCrawlResponse } from '../mappers/SiteReportMapper.js';
import { PageFetcher } from './PageFetcher.js';
import { PageLoaderAdapter } from './PageLoaderAdapter.js';
import { SiteContextReader } from './SiteContextReader.js';

/**
 * The whole-site use case: breadth across a level, depth through levels.
 *
 * The site context is read ONCE and handed to every page. robots.txt and the
 * sitemap govern the whole host, so re-reading them per page would be fifteen
 * identical requests to somebody else's server for one answer.
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

    /**
     * A crawl that read nothing is a FAILED READING, not a clean one.
     *
     * The crawler collects a page it cannot load into `errors` rather than
     * throwing, which is right when fourteen of fifteen pages loaded. When none
     * did, the summariser still had the site-wide findings to score, and a host
     * that does not resolve came back as 17, Legible, "a machine can read this,
     * name what it is, and answer from it": the most confidently wrong sentence
     * this tool could produce, about a site that is not there.
     */
    if (report.pagesScanned === 0) {
      // Says what happened, not why. The upstream reason for a failed fetch is
      // whatever the runtime handed back, and for a host that does not resolve
      // that is an opaque reference id: true, useless to the person who mistyped
      // a domain, and the string the surface would have shown them. An HTTP
      // status the site did return is worth repeating, and is the one case that
      // arrives here already phrased for a reader.
      const upstream = report.errors[0]?.error ?? '';
      throw new PageFetchError(
        'upstream_error',
        upstream.startsWith('Upstream responded')
          ? `That address could not be read: ${upstream.toLowerCase()}`
          : 'That address could not be read. Check the spelling, and that the site is up.',
      );
    }

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
