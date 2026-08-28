/** An upstream site that would not load. Answered as a 502: the caller's request was fine. */
export class PageFetchError extends Error {
  public readonly code: string;
  /**
   * The upstream status, null for a timeout or DNS failure that reached no
   * server. A NUMBER rather than text inside the message, because a caller has to
   * tell a refusal from a dead end: apple.com 403s a crawler on live subpages.
   */
  public readonly status: number | null;

  public constructor(code: string, message: string, status: number | null = null) {
    super(message);
    this.name = 'PageFetchError';
    this.code = code;
    this.status = status;
  }
}

/** Written by every tool's fetcher and read back by `assertPagesRead` below. */
const UPSTREAM_PREFIX = 'Upstream responded';

export function upstreamStatusMessage(status: number): string {
  return `${UPSTREAM_PREFIX} ${status}`;
}

/**
 * A crawl that read nothing is a FAILED READING, not a clean one. Collecting an
 * unloadable page into `errors` is right when fourteen of fifteen loaded; when
 * none did, a site behind a bot challenge would publish as a reading.
 */
export function assertPagesRead(
  pagesScanned: number,
  errors: readonly { readonly error: string }[],
): void {
  if (pagesScanned > 0) return;
  // Says what happened, not why. A status the site did return is worth
  // repeating; anything else is a runtime reference id, true and useless to
  // whoever mistyped a domain.
  const upstream = errors[0]?.error ?? '';
  throw new PageFetchError(
    'upstream_error',
    upstream.startsWith(UPSTREAM_PREFIX)
      ? `That address could not be read: ${upstream.toLowerCase()}`
      : 'That address could not be read. Check the spelling, and that the site is up.',
  );
}
