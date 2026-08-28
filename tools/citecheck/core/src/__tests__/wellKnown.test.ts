import { describe, expect, it } from 'vitest';
import { NO_ROBOTS, agentPostures, parseRobots } from '../access/robots.js';
import { parseSitemap } from '../access/sitemap.js';
import { type WellKnown, checkSitemapConflict, checkWellKnown } from '../access/wellKnown.js';

const TARGET = 'https://example.test/pricing';

function codes(input: Partial<WellKnown>): string[] {
  const robots = input.robots ?? NO_ROBOTS;
  return checkWellKnown({
    robots,
    llmsTxt: input.llmsTxt ?? null,
    sitemap: input.sitemap ?? null,
    postures: input.postures ?? agentPostures(robots, '/pricing'),
  }).map((finding) => finding.code);
}

const URLSET = (...locations: readonly string[]): string =>
  `<urlset>${locations.map((loc) => `<loc>${loc}</loc>`).join('')}</urlset>`;

describe('the sitemap', () => {
  it('matches an entry whose trailing slash or www differs', () => {
    const read = parseSitemap(
      URLSET('https://www.example.test/pricing/'),
      'https://example.test/sitemap.xml',
      TARGET,
    );
    expect(read.listsTarget).toBe(true);
  });

  it('reports a page a real sitemap omits', () => {
    const sitemap = parseSitemap(
      URLSET('https://example.test/about'),
      'https://example.test/sitemap.xml',
      TARGET,
    );
    expect(codes({ sitemap })).toContain('access.sitemap-omits-page');
  });

  /**
   * The false positive found by reading stripe.com. An index lists further
   * sitemaps rather than pages, so "this URL is not among its entries" is true
   * of every page on the site and says nothing about any of them.
   */
  it('does not claim a page is missing from a sitemap INDEX', () => {
    const sitemap = parseSitemap(
      '<sitemapindex><loc>https://example.test/sitemap-1.xml</loc></sitemapindex>',
      'https://example.test/sitemap.xml',
      TARGET,
    );
    expect(sitemap.isIndex).toBe(true);
    expect(codes({ sitemap })).not.toContain('access.sitemap-omits-page');
  });

  it('reports a sitemap robots.txt does not name', () => {
    const sitemap = parseSitemap(URLSET(TARGET), 'https://example.test/sitemap.xml', TARGET);
    const robots = parseRobots('User-agent: *\nAllow: /');
    expect(codes({ sitemap, robots })).toContain('access.sitemap-unlisted');
  });

  it('stays quiet when robots.txt names the sitemap', () => {
    const sitemap = parseSitemap(URLSET(TARGET), 'https://example.test/sitemap.xml', TARGET);
    const robots = parseRobots(
      'Sitemap: https://example.test/sitemap.xml\nUser-agent: *\nAllow: /',
    );
    expect(codes({ sitemap, robots })).not.toContain('access.sitemap-unlisted');
  });
});

describe('contradictions', () => {
  /**
   * The posture itself is never charged, so the only thing that can fire here
   * is two of the site's own files disagreeing.
   */
  it('charges an llms.txt beside a robots.txt that turns MOST agents away', () => {
    const robots = parseRobots('User-agent: *\nDisallow: /');
    expect(codes({ robots, llmsTxt: '# Example\n> A guide.' })).toContain(
      'access.llms-contradiction',
    );
  });

  /**
   * notion.com publishes an llms.txt and blocks two agents of fourteen, allowing
   * OpenAI, Anthropic and Perplexity while refusing Meta and Amazon. That is a
   * considered policy, and charging it charged them for making a decision.
   */
  it('does not charge a selective block beside an llms.txt', () => {
    const robots = parseRobots(
      'User-agent: *\nAllow: /\nUser-agent: Amazonbot\nDisallow: /\nUser-agent: meta-externalagent\nDisallow: /',
    );
    expect(codes({ robots, llmsTxt: '# Example\n> A guide.' })).not.toContain(
      'access.llms-contradiction',
    );
  });

  it('does not charge a blocked agent on its own', () => {
    const robots = parseRobots('User-agent: GPTBot\nDisallow: /');
    expect(codes({ robots })).not.toContain('access.llms-contradiction');
  });

  it('charges a page the sitemap offers and robots.txt refuses', () => {
    const sitemap = parseSitemap(URLSET(TARGET), 'https://example.test/sitemap.xml', TARGET);
    const found = checkSitemapConflict(sitemap, true);
    expect(found.map((finding) => finding.code)).toEqual(['access.sitemap-conflict']);
    // Major, not blocker: the page is still unreachable to a crawler, but
    // `access.disallowed` already charges that. This is the contradiction.
    expect(found[0]?.impact).toBe('major');
  });

  it('stays quiet when the sitemap and robots.txt agree', () => {
    const sitemap = parseSitemap(URLSET(TARGET), 'https://example.test/sitemap.xml', TARGET);
    expect(checkSitemapConflict(sitemap, false)).toHaveLength(0);
  });
});

describe('absence', () => {
  it('reports a missing robots.txt and a missing sitemap separately', () => {
    expect(codes({})).toEqual(expect.arrayContaining(['access.no-robots', 'access.no-sitemap']));
  });
});
