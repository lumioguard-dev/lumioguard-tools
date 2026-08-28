import { PageFetchError, SafeFetcher, readText, upstreamStatusMessage } from '@lumioguard/api-core';
import { PageSnapshot } from '@lumioguard/slopmeter-core';

const USER_AGENT =
  'Mozilla/5.0 (compatible; LumioGuard-Slopmeter/0.1; +https://lumioguard.dev/slopmeter)';

const KEEP_HEADERS = [
  'server',
  'x-powered-by',
  'x-vercel-id',
  'x-nf-request-id',
  'content-type',
] as const;

const MAX_STYLESHEETS = 6;
const MAX_CSS_BYTES = 400_000;
const MAX_HTML_BYTES = 2_000_000;

interface PageFetcherOptions {
  readonly timeoutMs?: number;
}

/**
 * The only I/O in the product. Isolated behind a class so the analyzer stays
 * pure and every rule can be tested from a fixture.
 */
export class PageFetcher {
  private readonly timeoutMs: number;
  private readonly safeFetcher = new SafeFetcher();

  public constructor(options: PageFetcherOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? 12_000;
  }

  public async fetchSnapshot(target: URL): Promise<PageSnapshot> {
    const fetched = await this.request(target.toString(), {
      accept: 'text/html,*/*',
    });
    const response = fetched.response;

    if (!response.ok) {
      throw new PageFetchError('upstream_error', upstreamStatusMessage(response.status));
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType !== '' && !/text\/html|application\/xhtml/i.test(contentType)) {
      throw new PageFetchError(
        'not_html',
        `Not an HTML document (${contentType.split(';')[0] ?? contentType})`,
      );
    }

    const html = (await readText(response, MAX_HTML_BYTES)).text;
    const headers: Record<string, string> = {};
    for (const name of KEEP_HEADERS) {
      const value = response.headers.get(name);
      if (value !== null) headers[name] = value;
    }

    return PageSnapshot.create({
      url: fetched.url.toString(),
      html,
      stylesheets: await this.fetchStylesheets(html, fetched.url.toString()),
      headers,
    });
  }

  private async fetchStylesheets(html: string, baseUrl: string): Promise<string[]> {
    const hrefs = [...html.matchAll(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi)]
      .map((match) => match[0].match(/href=["']([^"']+)["']/i)?.[1])
      .filter((href): href is string => href !== undefined)
      .slice(0, MAX_STYLESHEETS);

    const sheets = await Promise.all(
      hrefs.map(async (href) => {
        try {
          const absolute = new URL(href, baseUrl);
          const response = (await this.request(absolute.toString(), {}, 8_000)).response;
          if (!response.ok) return null;
          return (await readText(response, MAX_CSS_BYTES)).text;
        } catch {
          // A stylesheet that will not load is not a scan failure.
          return null;
        }
      }),
    );

    return sheets.filter((sheet): sheet is string => sheet !== null);
  }

  private async request(
    url: string,
    extraHeaders: Record<string, string>,
    timeoutMs = this.timeoutMs,
  ) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await this.safeFetcher.fetch(url, {
        headers: { 'user-agent': USER_AGENT, ...extraHeaders },
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new PageFetchError('timeout', `Timed out after ${timeoutMs}ms`);
      }
      throw new PageFetchError(
        'fetch_failed',
        error instanceof Error ? error.message : 'Fetch failed',
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
