import { PageFetchError, TargetResolver } from '@lumioguard/api-core';
import { describe, expect, it } from 'vitest';
import { CrawlService } from '../services/CrawlService.js';
import type { PageFetcher } from '../services/PageFetcher.js';
import { SiteContextReader } from '../services/SiteContextReader.js';

const PAGE = `<!doctype html><html lang="en"><head><title>A page worth reading</title>
<meta name="description" content="A description long enough to count as a summary of the page.">
<link rel="canonical" href="https://example.test/"></head>
<body><main><h1>A page worth reading</h1><p>${'A sentence about a page worth reading. '.repeat(20)}</p></main></body></html>`;

/** Everything the well-known reads ask for is absent, which is the common case. */
function fetcherThatServes(page: string | null): PageFetcher {
  return {
    fetchPage: async (target: URL) => {
      if (page === null) throw new PageFetchError('fetch_failed', 'getaddrinfo ENOTFOUND');
      return {
        url: target.toString(),
        html: page,
        headers: {},
        status: 200,
        delivery: { status: 200, redirects: 0, requestedUrl: null, temporary: false },
      };
    },
    probeAsAgent: async () => null,
    fetchText: async () => null,
  } as unknown as PageFetcher;
}

function serviceOver(page: string | null): CrawlService {
  const fetcher = fetcherThatServes(page);
  return new CrawlService({
    resolver: new TargetResolver(),
    fetcher,
    siteReader: new SiteContextReader(fetcher),
    clock: () => new Date('2026-08-19T00:00:00.000Z'),
  });
}

describe('a crawl that read nothing', () => {
  /**
   * The failure that looks like success. The crawler collects a page it cannot
   * load into `errors` rather than throwing, so when NONE of it loaded the
   * summariser still scored the site-wide findings and a dead host read Legible.
   */
  it('fails the reading rather than reporting a quotable site', async () => {
    await expect(serviceOver(null).crawlSite('not-a-real-host.invalid')).rejects.toBeInstanceOf(
      PageFetchError,
    );
  });

  /**
   * The reason a fetch failed is whatever the runtime handed back, and for a
   * host that does not resolve that is an opaque reference id. It must not reach
   * a person who simply mistyped a domain.
   */
  it('does not forward the runtime’s reason to the reader', async () => {
    await expect(serviceOver(null).crawlSite('not-a-real-host.invalid')).rejects.toThrow(
      /could not be read/i,
    );
    await expect(serviceOver(null).crawlSite('not-a-real-host.invalid')).rejects.not.toThrow(
      /ENOTFOUND/,
    );
  });
});

describe('a crawl that read something', () => {
  it('answers a reading', async () => {
    const report = await serviceOver(PAGE).crawlSite('example.test');
    expect(report.pagesScanned).toBe(1);
    expect(report.host).toBe('example.test');
    expect(report.fetchedAt).toBe('2026-08-19T00:00:00.000Z');
  });

  /** Absent is reported as absent, never as looked-at-and-fine. */
  it('says what it did not read', async () => {
    const report = await serviceOver(PAGE).crawlSite('example.test');
    expect(report.sources).toEqual({
      robotsTxt: false,
      sitemap: false,
      llmsTxt: false,
      agentFetch: false,
    });
  });

  it('refuses a target the resolver will not allow', async () => {
    await expect(serviceOver(PAGE).crawlSite('http://127.0.0.1/')).rejects.toThrow();
  });
});
