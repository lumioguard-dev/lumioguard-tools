import { type CrawlResponse, crawlResponseSchema } from '@lumioguard/shared';
import { ApiClient } from '@lumioguard/web-core';

/** Only the crawl: the surface offers one action. `/api/scan` is still served. */
export class ScanClient extends ApiClient {
  public crawl(
    url: string,
    options: { depth?: number; maxPages?: number } = {},
    signal?: AbortSignal,
  ): Promise<CrawlResponse> {
    return this.post('/api/crawl', { url, ...options }, crawlResponseSchema, signal);
  }
}
