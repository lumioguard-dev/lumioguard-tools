import { describe, expect, it } from 'vitest';
import { PAGES } from '../../src/pages.js';
import { CATALOGUE, SCAN_SLUG } from '../../src/tools/catalogue.js';
import { llmsTxt, robotsTxt, sitemapXml } from '../wellKnown.js';

const ORIGIN = 'https://example.test';
const ROOT = { base: ORIGIN, path: '' };

/**
 * Every field a robots.txt may carry, as the major crawlers document them. Held
 * here as well as in Citecheck's parser because the console may not import an
 * engine: a field outside this list is skipped in silence, never in force.
 */
const KNOWN_FIELDS = new Set([
  'user-agent',
  'disallow',
  'allow',
  'sitemap',
  'crawl-delay',
  'host',
  'noindex',
  'clean-param',
  'request-rate',
  'visit-time',
]);

describe('robots.txt', () => {
  it('uses only fields a crawler recognises', () => {
    for (const raw of robotsTxt(ROOT).split('\n')) {
      const line = raw.replace(/#.*$/, '').trim();
      if (line === '') continue;
      const field = line.slice(0, line.indexOf(':')).toLowerCase();
      expect(line, `"${line}" is not a Field: value line`).toContain(':');
      expect(KNOWN_FIELDS.has(field), `"${field}" is a field nothing reads`).toBe(true);
    }
  });

  it('turns nobody away', () => {
    // `Disallow:` with no value is RFC 9309 for "all of it is yours"; blocking
    // machines here would be the `access.llms-contradiction` pair.
    const text = robotsTxt(ROOT);
    expect(text).toContain('User-agent: *');
    expect(text).toMatch(/^Disallow:\s*$/m);
    expect(text).not.toMatch(/^Disallow:\s*\//m);
  });

  it('names the sitemap, so a crawler that reads this first still finds it', () => {
    // `access.sitemap-unlisted`: crawlers guessing at /sitemap.xml find it, the
    // ones that read robots.txt first do not look.
    expect(robotsTxt(ROOT)).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  });

  it('omits the sitemap line rather than writing a relative one', () => {
    // There is no relative form of Sitemap:, so with no origin there is no
    // honest line to write.
    expect(robotsTxt(null)).not.toContain('Sitemap:');
    expect(robotsTxt(null)).toContain('User-agent: *');
  });
});

describe('sitemap.xml', () => {
  const xml = sitemapXml(ROOT);

  it('lists the app, every tool page and every explainer, and nothing else', () => {
    // A site READING is absent on purpose: those live at `?site=…` and
    // canonicalise back, so each would be one document under many names. A
    // TOOL page is its own document with its own canonical, so it belongs.
    expect([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])).toEqual([
      `${ORIGIN}/`,
      `${ORIGIN}/${SCAN_SLUG}`,
      ...CATALOGUE.map((tool) => `${ORIGIN}/${tool.slug}`),
      ...PAGES.map((page) => `${ORIGIN}${page.path}`),
    ]);
  });

  it('claims nothing it cannot know', () => {
    // A lastmod would have to be the build time, which changes when nothing
    // about the page did. changefreq and priority are read by nothing.
    expect(xml).not.toContain('lastmod');
    expect(xml).not.toContain('changefreq');
    expect(xml).not.toContain('priority');
  });

  it('declares the namespace, without which it is not a sitemap', () => {
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  });
});

describe('llms.txt', () => {
  const text = llmsTxt(ROOT);

  it('opens the way the format requires: one H1, then a blockquote summary', () => {
    const lines = text.split('\n').filter((line) => line.trim() !== '');
    expect(lines[0]).toMatch(/^# \S/);
    expect(lines[1]).toMatch(/^> \S/);
  });

  it('describes the readings the app actually offers', () => {
    for (const tool of CATALOGUE) {
      expect(text, `${tool.id} is missing`).toContain(tool.label);
      expect(text).toContain(`/?tools=${tool.id}`);
    }
  });

  it('falls back to relative links rather than inventing a host', () => {
    expect(llmsTxt(null)).toContain('](/?tools=');
  });
});
