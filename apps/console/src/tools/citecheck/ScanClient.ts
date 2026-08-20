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
   * No depth or maxPages on the wire from here, deliberately.
   *
   * The API accepts them, and the button that starts a reading offers no way to
   * choose. A client that sent its own numbers while the copy described the
   * defaults is the exact failure the repo's writing rule was written for.
   */
  public crawl(url: string, signal?: AbortSignal): Promise<CitationCrawlResponse> {
    return this.post('/api/crawl', { url }, citationCrawlResponseSchema, signal);
  }
}
