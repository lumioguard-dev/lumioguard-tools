import type { TargetResolver } from '@lumioguard/api-core';
import type { PageInput, PageLoader } from '@lumioguard/citecheck-core';
import type { PageFetcher } from './PageFetcher.js';

/**
 * Every discovered link is re-validated through `TargetResolver`: links come
 * from a third-party page, so a crawl must not become a way to make the Worker
 * fetch a private address on someone else's behalf.
 */
export class PageLoaderAdapter implements PageLoader {
  private readonly fetcher: PageFetcher;
  private readonly resolver: TargetResolver;

  public constructor(fetcher: PageFetcher, resolver: TargetResolver) {
    this.fetcher = fetcher;
    this.resolver = resolver;
  }

  public async load(url: string): Promise<PageInput> {
    return this.fetcher.fetchPage(this.resolver.resolve(url));
  }
}
