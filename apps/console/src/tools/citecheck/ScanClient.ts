import {
  type CitationCrawlResponse,
  type CitationResponse,
  citationCrawlResponseSchema,
  citationResponseSchema,
} from '@lumioguard/shared';
import { ApiClient } from '@lumioguard/web-core';

export class ScanClient extends ApiClient {
  public scan(url: string, signal?: AbortSignal): Promise<CitationResponse> {
    return this.post('/api/scan', { url }, citationResponseSchema, signal);
  }

  /**
   * No depth or maxPages on the wire, deliberately: the API accepts them and the
   * button offers no way to choose, so sending numbers the copy never described is
   * the failure the repo's writing rule was written for.
   */
  public crawl(url: string, signal?: AbortSignal): Promise<CitationCrawlResponse> {
    return this.post('/api/crawl', { url }, citationCrawlResponseSchema, signal);
  }
}
