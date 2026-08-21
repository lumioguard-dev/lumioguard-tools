/** An upstream site that would not load. Answered as a 502: the caller's request was fine. */
export class PageFetchError extends Error {
  public readonly code: string;
  /**
   * The upstream status, where there was one. Null for a timeout or a DNS
   * failure, which never reached a server.
   *
   * Carried as a NUMBER rather than left inside the message, because a caller
   * has to tell a refusal from a dead end. A crawl that reads "Upstream
   * responded 403" off a link and calls it broken reports a site's bot filter
   * as its own broken links: apple.com answers its subpages 403 to an unknown
   * crawler, and every one of them was listed as leading nowhere.
   */
  public readonly status: number | null;

  public constructor(code: string, message: string, status: number | null = null) {
    super(message);
    this.name = 'PageFetchError';
    this.code = code;
    this.status = status;
  }
}
