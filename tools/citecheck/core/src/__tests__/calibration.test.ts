import { CitationTier } from '@lumioguard/shared';
import { describe, expect, it } from 'vitest';
import { NO_SITE_CONTEXT, analyzePage } from '../CiteAnalyzer.js';
import { type CiteFinding, orderFindings } from '../domain/CiteFinding.js';
import { scoreCitation } from '../scoring/CiteScore.js';

/**
 * The weights are set by pages answer engines demonstrably quote every day, and
 * such a page must come out Legible. The fixtures are not those pages but
 * minimal documents carrying the same absences, so the calibration lives here.
 */
function read(html: string): { score: number; tier: string; codes: string[] } {
  const result = analyzePage({ url: 'https://example.test/page', html }, NO_SITE_CONTEXT);
  const ordered: CiteFinding[] = orderFindings(result.findings);
  const scored = scoreCitation(ordered);
  return { score: scored.score, tier: scored.tier, codes: ordered.map((f) => f.code) };
}

const PROSE = 'A paragraph of real explanation about the subject of this page. '.repeat(14);

/**
 * Modelled on the nginx reference, the worst-scoring page in the cited corpus:
 * no JSON-LD, description, canonical, OpenGraph or `lang`, and its only `h1` in
 * the nav. It DOES carry a viewport, as all twenty-four real pages read did.
 */
const LIKE_NGINX_DOCS = `<!doctype html><html><head><title>Module ngx_http_core_module</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"></head>
  <body>
    <nav><h1><a href="/"><img src="/logo.svg" alt="NGINX"></a></h1></nav>
    <h2>Module ngx_http_core_module</h2>
    <p>${PROSE}</p>
    <h4>Directives</h4>
    <p>${PROSE}</p>
    <a href="/en/docs/">Documentation</a>
  </body></html>`;

/** Modelled on Wikipedia: structured data present, no meta description. */
const LIKE_WIKIPEDIA = `<!doctype html><html lang="en"><head><title>HTTP - Wikipedia</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="canonical" href="https://example.test/page">
  <meta property="og:title" content="HTTP">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article",
    "name":"HTTP","sameAs":"http://www.wikidata.org/entity/Q8777",
    "author":{"@type":"Organization","name":"Contributors"},"datePublished":"2001-01-15"}</script>
  </head><body><main><h1>HTTP</h1><p>${PROSE}</p>
  <h2>History</h2><p>${PROSE}</p><ul><li>One</li></ul>
  <a href="/other">Another article</a></main></body></html>`;

describe('a page the world already cites', () => {
  it('is Legible even with no structured data and no metadata at all', () => {
    const { score, tier } = read(LIKE_NGINX_DOCS);
    expect(tier).toBe(CitationTier.Legible);
    expect(score).toBeGreaterThan(80);
  });

  it('is Legible when its only gap is a missing description', () => {
    expect(read(LIKE_WIKIPEDIA).tier).toBe(CitationTier.Legible);
  });

  /**
   * The claim the corpus overturned. Five of six cited references ship no
   * JSON-LD, four carry no meta description, two have no `h1`: none of those can
   * be a barrier to citation, so none of them may cost the page anything.
   */
  it.each([
    ['structured.absent', LIKE_NGINX_DOCS],
    ['document.no-description', LIKE_NGINX_DOCS],
    ['document.no-canonical', LIKE_NGINX_DOCS],
    ['document.no-lang', LIKE_NGINX_DOCS],
    ['structured.no-opengraph', LIKE_NGINX_DOCS],
  ])('flags %s rather than charging for it', (code, html) => {
    const result = analyzePage({ url: 'https://example.test/page', html }, NO_SITE_CONTEXT);
    const found = result.findings.find((f) => f.code === code);
    expect(found, `${code} did not fire on the fixture built to trigger it`).toBeDefined();
    expect(found?.impact).toBe('absent');
  });

  /**
   * The line the flag is drawn on: the page not PUBLISHING a signal is flagged,
   * and the page's own structure is still judged. A document with no `h1` is
   * missing something a reader can see, not a tag it never owed anyone.
   */
  it('still charges a document defect as a finding', () => {
    const result = analyzePage(
      { url: 'https://example.test/page', html: LIKE_NGINX_DOCS },
      NO_SITE_CONTEXT,
    );
    expect(result.findings.find((f) => f.code === 'document.no-h1')?.impact).toBe('minor');
  });
});

/**
 * Definitional rather than measured: a page that says noindex, or serves no
 * text, cannot be quoted whatever else is true of it. The corpus does not move
 * them, and no markup underneath pulls one back out of the band it lands in.
 */
describe('a page that genuinely cannot be quoted', () => {
  const wrap = (head: string, body: string): string =>
    `<!doctype html><html lang="en"><head><title>A page about a subject</title>
     <meta name="description" content="A description that summarises this page properly.">
     <link rel="canonical" href="https://example.test/page">${head}</head>
     <body><main>${body}</main></body></html>`;

  it('is Unreadable when it says noindex', () => {
    const { tier, codes } = read(
      wrap('<meta name="robots" content="noindex">', `<h1>A</h1><p>${PROSE}</p>`),
    );
    expect(codes).toContain('access.noindex');
    expect(tier).toBe(CitationTier.Unreadable);
  });

  it('is Unreadable when it forbids being quoted', () => {
    const { tier, codes } = read(
      wrap('<meta name="robots" content="nosnippet">', `<h1>A</h1><p>${PROSE}</p>`),
    );
    expect(codes).toContain('access.nosnippet');
    expect(tier).toBe(CitationTier.Unreadable);
  });

  it('is Unreadable when the body is empty until JavaScript runs', () => {
    const { tier, codes } = read(wrap('', '</main><div id="root"></div><main>'));
    expect(codes).toContain('access.shell');
    expect(tier).toBe(CitationTier.Unreadable);
  });

  it('is Unreadable when its canonical hands citation to another host', () => {
    const html = `<!doctype html><html lang="en"><head><title>A page about a subject</title>
      <meta name="description" content="A description that summarises this page properly.">
      <link rel="canonical" href="https://somewhere-else.test/page"></head>
      <body><main><h1>A</h1><p>${PROSE}</p></main></body></html>`;
    const { tier, codes } = read(html);
    expect(codes).toContain('document.foreign-canonical');
    expect(tier).toBe(CitationTier.Unreadable);
  });

  /**
   * `answer.empty` counted words inside `contentRegion`, which trusts `<main>`,
   * and canva.com marks one holding seventeen words of a 1,114-word page: a
   * working site called empty, at blocker severity. `access.shell` survives.
   */
  it('does not call a page with a small <main> empty', () => {
    const html = `<!doctype html><html lang="en"><head><title>A page about a subject</title>
      <meta name="description" content="A description that summarises this page properly.">
      <link rel="canonical" href="https://example.test/page"></head><body>
      <nav>${'A menu label. '.repeat(60)}</nav>
      <main><h1>A</h1><p>A short hero line about the subject.</p></main></body></html>`;
    const { codes } = read(html);
    expect(codes).not.toContain('answer.empty');
    expect(codes).not.toContain('access.shell');
  });

  /**
   * `answer.thin` is gone. Its line sat at 120 words with nothing behind the
   * number, and a page of 119 words is not reliably worse than one of 121.
   * Only the near-empty case survived, because that one is definitional.
   */
  it('leaves a short but present page alone', () => {
    const short = 'A sentence of real explanation about this subject. '.repeat(6);
    const { codes } = read(wrap('', `<h1>A</h1><p>${short}</p>`));
    expect(codes).not.toContain('answer.empty');
    expect(codes).not.toContain('answer.thin');
  });
});

describe('the ladder', () => {
  /** Minors co-occur on good pages, so eight of them must not reach Thin. */
  it('lets a page carry eight minor findings and stay Legible', () => {
    const eight = Array.from({ length: 8 }, (_, i) => ({
      code: `m${i}`,
      impact: 'minor' as const,
      area: 'document' as const,
      title: 't',
      detail: 'd',
      evidence: null,
      fix: null,
    }));
    expect(scoreCitation(eight).tier).toBe(CitationTier.Legible);
  });

  it('reaches Patchy on two material findings', () => {
    const two = Array.from({ length: 2 }, (_, i) => ({
      code: `M${i}`,
      impact: 'major' as const,
      area: 'document' as const,
      title: 't',
      detail: 'd',
      evidence: null,
      fix: null,
    }));
    expect(scoreCitation(two).tier).toBe(CitationTier.Patchy);
  });
});
