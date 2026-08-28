import type { TargetResolver } from '@lumioguard/api-core';
import type { PageLoader, PageSnapshot } from '@lumioguard/slopmeter-core';
import type { PageFetcher } from './PageFetcher.js';

/**
 * Joins the crawler's `PageLoader` port to the real fetcher. Every discovered link
 * is re-validated through `TargetResolver`: links come from a third-party page, so
 * a crawl must not fetch a private address on someone else's behalf.
 */
export class SnapshotLoader implements PageLoader {
  private readonly fetcher: PageFetcher;
  private readonly resolver: TargetResolver;

  public constructor(fetcher: PageFetcher, resolver: TargetResolver) {
    this.fetcher = fetcher;
    this.resolver = resolver;
  }

  public async load(url: string, _isEntry: boolean): Promise<PageSnapshot> {
    return this.fetcher.fetchSnapshot(this.resolver.resolve(url));
  }
}
