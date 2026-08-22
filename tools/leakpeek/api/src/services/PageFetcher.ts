import { PageFetchError, SafeFetcher, readText } from '@lumioguard/api-core';
import type { FetchedScript } from '@lumioguard/leakpeek-core';

const USER_AGENT =
  'Mozilla/5.0 (compatible; LumioGuard-Leakpeek/0.1; +https://lumioguard.dev/leakpeek)';

/**
 * Headers kept for analysis: the security headers whose absence is a finding,
 * and the fingerprint headers that name the host. Lower-cased, as a fetch
 * delivers them.
 */
const KEEP_HEADERS = [
  'content-security-policy',
  'strict-transport-security',
  'x-frame-options',
  'referrer-policy',
  'server',
  'x-powered-by',
  'x-vercel-id',
  'x-nf-request-id',
  'cf-ray',
  'content-type',
] as const;

const MAX_SCRIPTS = 8;
const MAX_SCRIPT_BYTES = 1_500_000;
const MAX_HTML_BYTES = 2_000_000;

interface FetchedPage {
  readonly url: string;
  readonly host: string;
  readonly title: string | null;
  readonly html: string;
  readonly headers: Record<string, string>;
  readonly scripts: FetchedScript[];
}

/**
 * The page fetch and the script fetches: the read-only I/O the passive tier
 * needs. Isolated behind a class so the engine stays pure and testable from a
 * fixture. The active probes (Supabase, source maps) live in ProbeRunner.
 */
export class PageFetcher {
  private readonly timeoutMs: number;
  private readonly safeFetcher = new SafeFetcher();

  public constructor(options: { timeoutMs?: number } = {}) {
    this.timeoutMs = options.timeoutMs ?? 12_000;
  }

  public async fetchPage(target: URL): Promise<FetchedPage> {
    const fetched = await this.request(target.toString(), { accept: 'text/html,*/*' });
    const response = fetched.response;
    if (!response.ok) {
      throw new PageFetchError('upstream_error', `Upstream responded ${response.status}`);
    }

    const html = (await readText(response, MAX_HTML_BYTES)).text;
    const finalUrl = fetched.url.toString();

    const headers: Record<string, string> = {};
    for (const name of KEEP_HEADERS) {
      const value = response.headers.get(name);
      if (value !== null) headers[name] = value;
    }

    return {
      url: finalUrl,
      host: new URL(finalUrl).host,
      title: titleOf(html),
      html,
      headers,
      scripts: await this.fetchScripts(html, finalUrl),
    };
  }

  private async fetchScripts(html: string, baseUrl: string): Promise<FetchedScript[]> {
    const srcs = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
      .map((match) => match[1])
      .filter((src): src is string => src !== undefined)
      .slice(0, MAX_SCRIPTS);

    const scripts = await Promise.all(
      srcs.map(async (src) => {
        try {
          const absolute = new URL(src, baseUrl);
          const response = (await this.request(absolute.toString(), {}, 8_000)).response;
          if (!response.ok) return null;
          const body = (await readText(response, MAX_SCRIPT_BYTES)).text;
          return { url: absolute.toString(), body } satisfies FetchedScript;
        } catch {
          // A script that will not load is not a scan failure.
          return null;
        }
      }),
    );

    return scripts.filter((script): script is FetchedScript => script !== null);
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

function titleOf(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1]?.trim() || null;
}
