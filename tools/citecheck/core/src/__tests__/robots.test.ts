import { describe, expect, it } from 'vitest';
import { agentPostures, allowedForAnyone, parseRobots } from '../access/robots.js';

/** The token every parser gets right, used to anchor the ones they get wrong. */
const AGENT = 'GPTBot';

function accessFor(text: string, path: string, agent = AGENT): string {
  return agentPostures(parseRobots(text), path).find((p) => p.agent === agent)?.access ?? 'missing';
}

describe('robots.txt', () => {
  /**
   * The failure this file exists for. Treating each `User-agent` line as its own
   * group silently drops the rules for every agent but the last one named, and
   * the report then simply says a blocked crawler may read.
   */
  it('shares one group across consecutive user-agent lines', () => {
    const text = ['User-agent: GPTBot', 'User-agent: CCBot', 'Disallow: /'].join('\n');
    expect(accessFor(text, '/', 'GPTBot')).toBe('blocked');
    expect(accessFor(text, '/', 'CCBot')).toBe('blocked');
  });

  it('starts a new group when a user-agent follows a rule', () => {
    const text = ['User-agent: GPTBot', 'Disallow: /', 'User-agent: CCBot', 'Allow: /'].join('\n');
    expect(accessFor(text, '/', 'GPTBot')).toBe('blocked');
    expect(accessFor(text, '/', 'CCBot')).toBe('allowed');
  });

  /**
   * Longest match wins and a tie goes to Allow. Compared in file order instead,
   * `Disallow: /` would blanket the carve-out beneath it and the blog would be
   * reported as blocked.
   */
  it('lets a longer Allow carve out of a blanket Disallow', () => {
    const text = ['User-agent: *', 'Disallow: /', 'Allow: /blog/'].join('\n');
    expect(accessFor(text, '/blog/post', AGENT)).toBe('allowed');
    expect(accessFor(text, '/private', AGENT)).toBe('blocked');
  });

  it('honours the wildcard and the end anchor', () => {
    const text = ['User-agent: *', 'Disallow: /*.pdf$'].join('\n');
    expect(accessFor(text, '/files/report.pdf', AGENT)).toBe('blocked');
    expect(accessFor(text, '/files/report.pdf.html', AGENT)).toBe('allowed');
  });

  /** An agent-specific group beats the wildcard, however permissive the wildcard is. */
  it('prefers the agent’s own group over the wildcard', () => {
    const text = ['User-agent: *', 'Allow: /', 'User-agent: GPTBot', 'Disallow: /'].join('\n');
    expect(accessFor(text, '/', 'GPTBot')).toBe('blocked');
    expect(accessFor(text, '/', 'CCBot')).toBe('allowed');
  });

  /**
   * `unmentioned` is not a synonym for allowed. It says the site never spoke to
   * this agent, which is the difference between a decision and a default.
   */
  it('reports unmentioned when no group applies', () => {
    const text = ['User-agent: Googlebot', 'Disallow: /admin'].join('\n');
    expect(accessFor(text, '/', 'GPTBot')).toBe('unmentioned');
  });

  it('drops an empty Disallow rather than matching every path with it', () => {
    const text = ['User-agent: *', 'Disallow:'].join('\n');
    expect(accessFor(text, '/anything', AGENT)).toBe('allowed');
  });

  it('ignores comments and reads sitemap lines', () => {
    const text = [
      '# a note',
      'Sitemap: https://x.test/sitemap.xml',
      'User-agent: *',
      'Allow: /',
    ].join('\n');
    expect(parseRobots(text).sitemaps).toEqual(['https://x.test/sitemap.xml']);
  });

  describe('the general crawler', () => {
    it('is allowed when nothing names the wildcard', () => {
      expect(allowedForAnyone(parseRobots('User-agent: GPTBot\nDisallow: /'), '/')).toBe(true);
    });

    it('is refused by a wildcard disallow', () => {
      expect(allowedForAnyone(parseRobots('User-agent: *\nDisallow: /'), '/page')).toBe(false);
    });
  });
});
