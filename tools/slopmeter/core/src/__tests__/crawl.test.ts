import { describe, expect, it } from 'vitest';
import { SlopAnalyzer } from '../SlopAnalyzer.js';
import { LinkExtractor } from '../crawl/LinkExtractor.js';
import type { PageLoader } from '../crawl/PageLoader.js';
import { SiteCrawler } from '../crawl/SiteCrawler.js';
import { UrlNormalizer } from '../crawl/UrlNormalizer.js';
import { PageSnapshot } from '../domain/PageSnapshot.js';
import { createDefaultRegistry } from '../rules/definitions/index.js';

const analyzer = new SlopAnalyzer(createDefaultRegistry());

/** Serves a fixed site map, so a crawl is deterministic and does no I/O. */
class FakeSite implements PageLoader {
  public readonly requested: string[] = [];

  public constructor(private readonly pages: Record<string, string>) {}

  public load(url: string): Promise<PageSnapshot> {
    this.requested.push(url);
    const html = this.pages[url];
    if (html === undefined) return Promise.reject(new Error('404'));
    return Promise.resolve(PageSnapshot.create({ url, html }));
  }
}

const shell = (body: string): string =>
  `<!doctype html><html lang="en"><head><title>Page</title><meta name="viewport" content="width=device-width"><link rel="canonical" href="x"><link rel="icon" href="/f.svg"></head><body>${body}</body></html>`;

describe('UrlNormalizer', () => {
  const normalizer = new UrlNormalizer();

  it('collapses URLs that mean the same page', () => {
    expect(normalizer.normalizeToString('https://a.test/x/#frag')).toBe('https://a.test/x');
    expect(normalizer.normalizeToString('https://a.test/x?utm_source=n&keep=1')).toBe(
      'https://a.test/x?keep=1',
    );
    expect(normalizer.normalizeToString('https://a.test/')).toBe('https://a.test/');
  });
});

describe('LinkExtractor', () => {
  const extractor = new LinkExtractor();

  it('takes same-origin document links only', () => {
    const html = `
      <a href="/about">a</a>
      <a href="https://other.test/x">b</a>
      <a href="/logo.png">c</a>
      <a href="mailto:x@y.z">d</a>
      <a href="#top">e</a>
      <a href="/docs/">f</a>`;
    expect(extractor.extract(html, 'https://a.test/').sort()).toEqual([
      'https://a.test/about',
      'https://a.test/docs',
    ]);
  });
});

describe('SiteCrawler', () => {
  it('walks breadth-first and by depth', async () => {
    const site = new FakeSite({
      'https://a.test/': shell('<h1>Home</h1><a href="/one">1</a><a href="/two">2</a>'),
      'https://a.test/one': shell('<h1>One</h1><a href="/deep">d</a>'),
      'https://a.test/two': shell('<h1>Two</h1>'),
      'https://a.test/deep': shell('<h1>Deep</h1>'),
    });

    const report = await new SiteCrawler(analyzer, site).crawl('https://a.test/', { depth: 2 });

    expect(report.pagesScanned).toBe(4);
    expect(report.maxDepthReached).toBe(2);
    expect(report.pages.find((p) => p.url === 'https://a.test/deep')?.depth).toBe(2);
  });

  it('stops at the requested depth', async () => {
    const site = new FakeSite({
      'https://a.test/': shell('<h1>Home</h1><a href="/one">1</a>'),
      'https://a.test/one': shell('<h1>One</h1><a href="/deep">d</a>'),
      'https://a.test/deep': shell('<h1>Deep</h1>'),
    });

    const report = await new SiteCrawler(analyzer, site).crawl('https://a.test/', { depth: 1 });
    expect(report.pagesScanned).toBe(2);
    expect(report.pages.some((p) => p.url === 'https://a.test/deep')).toBe(false);
  });

  it('honours maxPages', async () => {
    const links = Array.from({ length: 20 }, (_, i) => `<a href="/p${i}">${i}</a>`).join('');
    const pages: Record<string, string> = { 'https://a.test/': shell(`<h1>H</h1>${links}`) };
    for (let i = 0; i < 20; i++) pages[`https://a.test/p${i}`] = shell(`<h1>P${i}</h1>`);

    const report = await new SiteCrawler(analyzer, new FakeSite(pages)).crawl('https://a.test/', {
      depth: 2,
      maxPages: 5,
    });
    expect(report.pagesScanned).toBe(5);
  });

  it('visits each page once even when several link to it', async () => {
    const site = new FakeSite({
      'https://a.test/': shell('<h1>H</h1><a href="/one">1</a><a href="/two">2</a>'),
      'https://a.test/one': shell('<h1>One</h1><a href="/shared">s</a>'),
      'https://a.test/two': shell('<h1>Two</h1><a href="/shared">s</a>'),
      'https://a.test/shared': shell('<h1>Shared</h1>'),
    });

    const report = await new SiteCrawler(analyzer, site).crawl('https://a.test/', { depth: 3 });
    expect(site.requested.filter((u) => u === 'https://a.test/shared')).toHaveLength(1);
    expect(report.pagesScanned).toBe(4);
  });

  it('records a failed fetch without abandoning the crawl', async () => {
    const site = new FakeSite({
      'https://a.test/': shell('<h1>H</h1><a href="/gone">g</a><a href="/ok">o</a>'),
      'https://a.test/ok': shell('<h1>OK</h1>'),
    });

    const report = await new SiteCrawler(analyzer, site).crawl('https://a.test/', { depth: 1 });
    expect(report.pagesScanned).toBe(2);
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0]?.url).toBe('https://a.test/gone');
  });
});

describe('site verdict', () => {
  const slop = '<h1>Lorem ipsum dolor sit amet</h1><p>As an AI language model, I cannot.</p>';

  it('is the WORSE of homepage and median page, so page count cannot inflate it', async () => {
    // Nine clean interior pages must not lift a rotten homepage to clean, and
    // must not add up to a guilty verdict on their own. Worse is LOWER: the
    // scale runs higher-is-better.
    const pages: Record<string, string> = {
      'https://a.test/': shell(
        `${slop}${Array.from({ length: 9 }, (_, i) => `<a href="/c${i}">c</a>`).join('')}`,
      ),
    };
    for (let i = 0; i < 9; i++) pages[`https://a.test/c${i}`] = shell('<h1>Clean page</h1>');

    const report = await new SiteCrawler(analyzer, new FakeSite(pages)).crawl('https://a.test/', {
      depth: 1,
    });

    expect(report.site.homepageScore).toBeLessThan(80);
    expect(report.site.score).toBe(
      Math.min(report.site.homepageScore ?? 100, report.site.medianPageScore),
    );
  });

  it('surfaces signals that hide off the homepage without charging for them', async () => {
    const site = new FakeSite({
      'https://a.test/': shell('<h1>A perfectly ordinary homepage</h1><a href="/hidden">h</a>'),
      'https://a.test/hidden': shell(slop),
    });

    const report = await new SiteCrawler(analyzer, site).crawl('https://a.test/', { depth: 1 });
    const hidden = report.signals.filter((s) => s.weight > 0 && !s.onHomepage);

    expect(hidden.some((s) => s.ruleId === 'unfinished.lorem')).toBe(true);
    expect(report.site.hiddenSignals).toBe(hidden.length);
    // Reported, never charged: the score stays anchored to homepage and median.
    expect(report.site.score).toBe(
      Math.min(report.site.homepageScore ?? 100, report.site.medianPageScore),
    );
  });

  it('takes the heaviest occurrence of a signal seen on several pages', async () => {
    const site = new FakeSite({
      'https://a.test/': shell(`${slop}<a href="/two">2</a>`),
      'https://a.test/two': shell(slop),
    });

    const report = await new SiteCrawler(analyzer, site).crawl('https://a.test/', { depth: 1 });
    const lorem = report.signals.find((s) => s.ruleId === 'unfinished.lorem');
    expect(lorem?.pages).toBe(2);
    expect(lorem?.onHomepage).toBe(true);
  });
});
