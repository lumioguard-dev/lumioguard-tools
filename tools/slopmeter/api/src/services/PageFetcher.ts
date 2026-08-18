import { PageFetchError } from '@lumioguard/api-core';
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

interface PageFetcherOptions {
  readonly timeoutMs?: number;
}

/**
 * The only I/O in the product. Isolated behind a class so the analyzer stays
 * pure and every rule can be tested from a fixture.
 */
export class PageFetcher {
  private readonly timeoutMs: number;

  public constructor(options: PageFetcherOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? 12_000;
  }

  public async fetchSnapshot(target: URL): Promise<PageSnapshot> {
    const response = await this.request(target.toString(), {
      accept: 'text/html,*/*',
    });

    if (!response.ok) {
      throw new PageFetchError('upstream_error', `Upstream responded ${response.status}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType !== '' && !/text\/html|application\/xhtml/i.test(contentType)) {
      throw new PageFetchError(
        'not_html',
        `Not an HTML document (${contentType.split(';')[0] ?? contentType})`,
      );
    }

    const html = await response.text();
    const headers: Record<string, string> = {};
    for (const name of KEEP_HEADERS) {
      const value = response.headers.get(name);
      if (value !== null) headers[name] = value;
    }

    return PageSnapshot.create({
      url: response.url === '' ? target.toString() : response.url,
      html,
      stylesheets: await this.fetchStylesheets(html, response.url || target.toString()),
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
          const response = await this.request(absolute.toString(), {}, 8_000);
          if (!response.ok) return null;
          return (await response.text()).slice(0, MAX_CSS_BYTES);
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
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, {
        headers: { 'user-agent': USER_AGENT, ...extraHeaders },
        redirect: 'follow',
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
