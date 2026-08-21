import { PageFetchError } from '@lumioguard/api-core';
import type { PageInput } from '@lumioguard/citecheck-core';

const USER_AGENT =
  'Mozilla/5.0 (compatible; LumioGuard-Citecheck/0.1; +https://lumioguard.dev/citecheck)';

/**
 * The second identity, used once per reading to find out whether the site
 * treats a crawler differently.
 *
 * A REAL crawler token, not an invented one. The whole point of the comparison
 * is what a bot filter does when it recognises the caller, and a filter that
 * has never heard of `LumioGuard-Citecheck` waves it through exactly as it
 * waves a browser through, which would report every site as clean.
 */
const CRAWLER_USER_AGENT =
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot';

/**
 * Headers kept for analysis: the one that carries robots directives, plus the
 * fingerprint headers that name the host. Lower-cased, as a fetch delivers them.
 */
const KEEP_HEADERS = [
  'x-robots-tag',
  'content-type',
  'server',
  'x-powered-by',
  'x-vercel-id',
  'x-nf-request-id',
  'cf-ray',
  'last-modified',
] as const;

/** A page beyond this is not a document; the tail carries nothing worth reading. */
const MAX_HTML_BYTES = 2_000_000;

export interface FetchedPage extends PageInput {
  readonly headers: Record<string, string>;
  readonly status: number;
}

/** Redirect hops beyond this are not followed; a chain that long is the finding. */
const MAX_HOPS = 5;

export interface AgentProbe {
  readonly status: number;
  readonly html: string;
  readonly userAgent: string;
}

/**
 * The page fetches. Isolated behind a class so the engine stays pure and every
 * check is testable from a fixture with no network.
 */
export class PageFetcher {
  private readonly timeoutMs: number;

  public constructor(options: { timeoutMs?: number } = {}) {
    this.timeoutMs = options.timeoutMs ?? 12_000;
  }

  /**
   * The page, and what it took to get there.
   *
   * Redirects are followed a hop at a time rather than by the runtime, because
   * `redirect: 'follow'` reports only where it landed. How many hops, and
   * whether any of them was temporary, are two of the first things a search
   * audit asks and neither survives a followed redirect.
   */
  public async fetchPage(target: URL): Promise<FetchedPage> {
    let current = target.toString();
    let redirects = 0;
    let temporary = false;
    let response = await this.request(
      current,
      USER_AGENT,
      { accept: 'text/html,*/*' },
      undefined,
      'manual',
    );

    while (isRedirect(response.status) && redirects < MAX_HOPS) {
      const location = response.headers.get('location');
      if (location === null) break;
      temporary = temporary || response.status === 302 || response.status === 307;
      redirects += 1;
      current = new URL(location, current).toString();
      response = await this.request(
        current,
        USER_AGENT,
        { accept: 'text/html,*/*' },
        undefined,
        'manual',
      );
    }

    if (!response.ok) {
      throw new PageFetchError(
        'upstream_error',
        `Upstream responded ${response.status}`,
        response.status,
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType !== '' && !/text\/html|application\/xhtml/i.test(contentType)) {
      throw new PageFetchError(
        'not_html',
        `Not an HTML document (${contentType.split(';')[0] ?? contentType})`,
      );
    }

    const headers: Record<string, string> = {};
    for (const name of KEEP_HEADERS) {
      const value = response.headers.get(name);
      if (value !== null) headers[name] = value;
    }

    const url = response.url === '' ? current : response.url;
    return {
      url,
      html: (await response.text()).slice(0, MAX_HTML_BYTES),
      headers,
      status: response.status,
      delivery: {
        status: response.status,
        redirects,
        requestedUrl: redirects > 0 ? target.toString() : null,
        temporary,
      },
    };
  }

  /**
   * The same URL asked for again as a crawler.
   *
   * Never throws: this is a comparison, and a failed comparison costs the one
   * finding it would have produced rather than the whole reading. A `null`
   * reaches the surface as `agentFetch: false`, which the report says out loud
   * rather than presenting an unmade check as a passed one.
   */
  public async probeAsAgent(target: URL): Promise<AgentProbe | null> {
    try {
      const response = await this.request(
        target.toString(),
        CRAWLER_USER_AGENT,
        { accept: 'text/html,*/*' },
        8_000,
      );
      return {
        status: response.status,
        html: response.ok ? (await response.text()).slice(0, MAX_HTML_BYTES) : '',
        userAgent: 'GPTBot/1.1',
      };
    } catch {
      return null;
    }
  }

  /** A well-known file at the site root. Absent is an answer, not an error. */
  public async fetchText(url: string): Promise<string | null> {
    try {
      const response = await this.request(url, USER_AGENT, { accept: 'text/plain,text/*,*/*' });
      if (!response.ok) return null;
      return (await response.text()).slice(0, MAX_HTML_BYTES);
    } catch {
      return null;
    }
  }

  private async request(
    url: string,
    userAgent: string,
    extraHeaders: Record<string, string>,
    timeoutMs = this.timeoutMs,
    redirect: 'follow' | 'manual' = 'follow',
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, {
        headers: { 'user-agent': userAgent, ...extraHeaders },
        redirect,
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

function isRedirect(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}
