import { TargetResolver } from '@lumioguard/api-core';
import { analyzePage, analyzeSite } from '@lumioguard/citecheck-core';
import type { CitationResponse } from '@lumioguard/shared';
import { type ScanInputs, toCitationResponse } from '../mappers/CitationMapper.js';
import { PageFetcher } from './PageFetcher.js';
import { SiteContextReader } from './SiteContextReader.js';

export interface ScanServiceDeps {
  readonly resolver?: TargetResolver;
  readonly fetcher?: PageFetcher;
  readonly siteReader?: SiteContextReader;
  /** Injected so a test can pin the timestamp; defaults to now. */
  readonly clock?: () => Date;
}

/**
 * One page end to end. The crawler request goes out ALONGSIDE the browser one:
 * run in sequence, a site that rate-limits throttles the second, and the
 * cloaking check would then report a refusal the site never meant.
 */
export class ScanService {
  private readonly resolver: TargetResolver;
  private readonly fetcher: PageFetcher;
  private readonly siteReader: SiteContextReader;
  private readonly clock: () => Date;

  public constructor(deps: ScanServiceDeps = {}) {
    this.resolver = deps.resolver ?? new TargetResolver();
    this.fetcher = deps.fetcher ?? new PageFetcher();
    this.siteReader = deps.siteReader ?? new SiteContextReader(this.fetcher);
    this.clock = deps.clock ?? (() => new Date());
  }

  public async scan(rawUrl: string): Promise<CitationResponse> {
    const target = this.resolver.resolve(rawUrl);

    const [page, probe] = await Promise.all([
      this.fetcher.fetchPage(target),
      this.fetcher.probeAsAgent(target),
    ]);

    const site = await this.siteReader.read(target, probe, page.url);
    const result = analyzePage(page, site.context);

    const inputs: ScanInputs = {
      result,
      // The site's own findings are folded into a single-page reading, because
      // for one page the site IS the reading. On a crawl they are charged once
      // in the summarizer instead.
      siteFindings: analyzeSite(site.context.wellKnown),
      agents: site.context.wellKnown.postures,
      sources: site.sources,
      // Filled in by the route, which owns the network call: a scan stays
      // testable without a transport, and a failed hand-off cannot fail it.
      siteKey: null,
      scannedAt: this.clock().toISOString(),
    };

    return toCitationResponse(inputs);
  }
}
