import { CitationTier } from '@lumioguard/shared';
import { describe, expect, it } from 'vitest';
import { NO_SITE_CONTEXT, analyzePage } from '../CiteAnalyzer.js';
import { orderFindings } from '../domain/CiteFinding.js';
import { scoreCitation } from '../scoring/CiteScore.js';

/**
 * A login keeping itself out of an index is CORRECT. Charged as a blocker it
 * made trovapro.it, a site doing this right, report its own sign-in page as its
 * worst finding while the number said 88.
 */
function read(url: string, head: string, body = '<h1>A</h1><p>Real prose about this page.</p>') {
  const html = `<!doctype html><html lang="en"><head><title>A page about a subject</title>
    <meta name="description" content="A description that summarises this page properly.">
    <link rel="canonical" href="${url}">${head}</head>
    <body><main>${body}</main></body></html>`;
  const ordered = orderFindings(analyzePage({ url, html }, NO_SITE_CONTEXT).findings);
  const noindex = ordered.find((item) => item.code === 'access.noindex') ?? null;
  return { noindex, ...scoreCitation(ordered) };
}

const NOINDEX = '<meta name="robots" content="noindex">';
const LOGIN_FORM = '<form><input type="password" name="p"></form>';

describe('noindex on a page meant to be found', () => {
  it('is still a blocker, and still lands the page in the worst band', () => {
    const { noindex, tier } = read('https://example.test/guides/how-to', NOINDEX);
    expect(noindex?.impact).toBe('blocker');
    expect(tier).toBe(CitationTier.Unreadable);
  });

  /** The word inside a longer one is prose, not a path segment. */
  it.each([
    'https://example.test/account-management-tips',
    'https://example.test/blog/reset-your-expectations',
    'https://example.test/checkout-counter-design',
  ])('does not exempt %s', (url) => {
    expect(read(url, NOINDEX).noindex?.impact).toBe('blocker');
  });

  /**
   * A place that MIGHT hold public content is not an account surface. On a
   * marketplace a professional's profile is the page that most needs indexing,
   * and a public status dashboard or a registry is content too. Exempting these
   * would forgive the defect this tool exists to report.
   */
  it.each([
    ['a public profile', 'https://example.test/profile/jane-smith'],
    ['a profile at the root', 'https://example.test/profile'],
    ['a status dashboard', 'https://example.test/dashboard'],
    ['a public registry', 'https://example.test/registro/imprese'],
    ['a members directory', 'https://example.test/members/jane'],
  ])('still charges %s as a blocker', (_name, url) => {
    const { noindex, tier } = read(url, NOINDEX);
    expect(noindex?.impact).toBe('blocker');
    expect(tier).toBe(CitationTier.Unreadable);
  });
});

describe('noindex on an account surface', () => {
  it.each([
    ['an English path', 'https://example.test/login'],
    ['a nested one', 'https://example.test/auth/accedi/'],
    ['a localised one', 'https://example.test/registrati/'],
    ['a checkout', 'https://example.test/checkout'],
    ['a file', 'https://example.test/login.php'],
    ['a hyphenated possessive', 'https://example.test/my-account'],
    ['a hyphenated action', 'https://example.test/reset-password'],
    ['a localised possessive', 'https://example.test/mi-cuenta'],
  ])('is reported and not scored on %s', (_name, url) => {
    const { noindex, score, tier } = read(url, NOINDEX);
    expect(noindex?.impact).toBe('absent');
    expect(score).toBeGreaterThan(40);
    expect(tier).not.toBe(CitationTier.Unreadable);
  });

  /**
   * The second signal. trovapro.it's register page names no English segment and
   * serves no password field; its sign-in page serves one at a path that could
   * have been anything.
   */
  it('is reported and not scored on a password form at any path', () => {
    const { noindex } = read('https://example.test/enter', NOINDEX, LOGIN_FORM);
    expect(noindex?.impact).toBe('absent');
  });

  /** A flag is a note, so it carries no remediation to sell. */
  it('offers no fix, because nothing is broken', () => {
    expect(read('https://example.test/login', NOINDEX).noindex?.fix).toBeNull();
  });

  /** The exemption is for noindex alone: nosnippet on a login is still odd. */
  it('leaves the other directives alone', () => {
    const ordered = read(
      'https://example.test/login',
      '<meta name="robots" content="noindex,nosnippet">',
    );
    expect(ordered.noindex?.impact).toBe('absent');
    expect(ordered.score).toBeLessThan(100);
  });
});
