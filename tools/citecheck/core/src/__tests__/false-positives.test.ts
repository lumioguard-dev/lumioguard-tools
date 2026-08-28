import { describe, expect, it } from 'vitest';
import { NO_SITE_CONTEXT, analyzePage } from '../CiteAnalyzer.js';
import { checkBrokenLinks } from '../crawl/duplicates.js';

/**
 * One case per false positive found by reading seven well-built sites against
 * the served HTML. Each fired confidently and none looked wrong in the report,
 * which is why a reader cannot tell one from a real finding.
 */
function codesFor(html: string, url = 'https://example.test/'): string[] {
  return analyzePage({ url, html }, NO_SITE_CONTEXT).findings.map((finding) => finding.code);
}

/** A body with enough of everything that only the case under test can fire. */
function page(body: string, head = ''): string {
  return `<!doctype html><html lang="en"><head>
    <title>A page about reading web pages</title>
    <meta name="description" content="How a machine reads a page, and what stops it quoting one.">
    <link rel="canonical" href="https://example.test/">
    ${head}</head><body><main>
    <h1>A page about reading web pages</h1>
    <p>${'A sentence about how a machine reads a page. '.repeat(12)}</p>
    <ul><li>One</li><li>Two</li></ul>
    <a href="/other">Another page on this site</a>
    ${body}</main></body></html>`;
}

describe('OpenGraph', () => {
  /** MDN ships `name="og:title"`; only `property=` was read, so MDN had none. */
  it('is found when it is written with name= rather than property=', () => {
    const head = '<meta name="og:title" content="A page"><meta name="og:description" content="X">';
    expect(codesFor(page('', head))).not.toContain('structured.no-opengraph');
  });

  it('is still found the spec way', () => {
    const head = '<meta property="og:title" content="A page">';
    expect(codesFor(page('', head))).not.toContain('structured.no-opengraph');
  });

  it('is still reported when genuinely absent', () => {
    expect(codesFor(page(''))).toContain('structured.no-opengraph');
  });
});

describe('the outline', () => {
  /**
   * stripe.com layers a second, identical `<h1>` marked `aria-hidden` for a
   * visual effect. Counted as a heading it claimed two subjects for a page
   * with one.
   */
  it('does not count an aria-hidden duplicate as a second subject', () => {
    const body = '<h1 aria-hidden="true">A page about reading web pages</h1>';
    expect(codesFor(page(body))).not.toContain('document.many-h1');
  });

  it('still reports two h1s that say different things', () => {
    expect(codesFor(page('<h1>Something else entirely</h1>'))).toContain('document.many-h1');
  });

  /**
   * stripe.com's pricing page carries 112 h1 elements, one per menu card. The
   * markup really is that, but "83 top-level subjects" read like a parser bug,
   * so the two cases are now separate findings with separate words.
   */
  it('calls a wall of h1s a styling problem, not an outline of 80 subjects', () => {
    const many = Array.from({ length: 12 }, (_, i) => `<h1>Menu label ${i}</h1>`).join('');
    const codes = codesFor(page(many));
    expect(codes).toContain('document.h1-as-style');
    expect(codes).not.toContain('document.many-h1');
  });

  /** supabase.com: a screen-reader `<h2>Footer</h2>` above six `<h6>` columns. */
  it('ignores heading levels inside a footer', () => {
    const body = '</main><footer><h2>Footer</h2><h6>Product</h6><h6>Company</h6></footer><main>';
    expect(codesFor(page(body))).not.toContain('document.skipped-level');
  });

  /**
   * `document.skipped-level` is gone. It fired on the React reference,
   * Britannica, Healthline and Investopedia, and heading order is neither a
   * citation nor a ranking barrier.
   */
  it('no longer judges heading order', () => {
    expect(codesFor(page('<h4>Nested under nothing</h4>'))).not.toContain('document.skipped-level');
  });

  /**
   * lovable.dev closes `</main>` before its hero, so an outline restricted to
   * the content region reported the page as having no h1 at all. Excluding
   * only footer and nav keeps it.
   */
  it('finds an h1 that sits outside main', () => {
    const html = `<!doctype html><html lang="en"><head><title>A page about reading pages</title>
      <meta name="description" content="How a machine reads a page and what stops it quoting.">
      <link rel="canonical" href="https://example.test/"></head><body>
      <main><p>${'Words about the page. '.repeat(40)}</p></main>
      <section><h1>A page about reading pages</h1></section>
      <a href="/x">Another page</a></body></html>`;
    expect(codesFor(html)).not.toContain('document.no-h1');
  });
});

describe('the meta description', () => {
  /** vercel.com: "The autonomous stack for every app and agent." is 45 characters. */
  it('accepts a short but complete sentence', () => {
    const head =
      '<meta name="description" content="The autonomous stack for every app and agent.">';
    const html = page('', head).replace(
      '<meta name="description" content="How a machine reads a page, and what stops it quoting one.">',
      '',
    );
    expect(codesFor(html)).not.toContain('document.thin-description');
  });

  it('still reports a one-word label', () => {
    const html = page('').replace(
      'How a machine reads a page, and what stops it quoting one.',
      'Home',
    );
    expect(codesFor(html)).toContain('document.thin-description');
  });
});

describe('anchor text', () => {
  /**
   * stripe.com's "Link" points at /payments/link, which is their product.
   * Lighthouse does not treat that word as non-descriptive either, and the list
   * here is now lifted from its `link-text` audit.
   */
  it('does not treat a product name as a placeholder', () => {
    const body = '<a href="/payments/link">Link</a><a href="/pay">Payments</a>';
    expect(codesFor(page(body))).not.toContain('document.vague-anchors');
  });

  /** The words Lighthouse does list, including the single ones. */
  it('reports the placeholders Lighthouse names', () => {
    expect(codesFor(page('<a href="/a">Learn more</a>'))).toContain('document.vague-anchors');
    expect(codesFor(page('<a href="/b">here</a>'))).toContain('document.vague-anchors');
  });

  it('counts one target once however often it is repeated', () => {
    const four =
      '<a href="/a">Read more</a><a href="/a">Read more</a><a href="/a">Read more</a>' +
      '<a href="/a">Read more</a>';
    const one = '<a href="/a">Read more</a>';
    expect(codesFor(page(four))).toEqual(codesFor(page(one)));
  });
});

describe('dates', () => {
  const ld = (json: string): string => `<script type="application/ld+json">${json}</script>`;

  /** A marketing homepage is evergreen; it fired on six of seven pages read. */
  it('are not expected of a page that is not an article', () => {
    const head = ld('{"@type":"Organization","name":"Example","sameAs":["https://x.test"]}');
    expect(codesFor(page('', head))).not.toContain('answer.undated');
  });

  it('are expected of something calling itself an Article', () => {
    const head = ld('{"@type":"Article","headline":"A page about reading web pages"}');
    expect(codesFor(page('', head))).toContain('answer.undated');
  });

  it('are satisfied by a structured date', () => {
    const head = ld(
      '{"@type":"Article","headline":"A page about reading web pages","datePublished":"2026-01-05"}',
    );
    expect(codesFor(page('', head))).not.toContain('answer.undated');
  });

  /** Two findings for one missing date charged the same fact twice. */
  it('are reported once, never as two findings', () => {
    const head = ld('{"@type":"Article","headline":"A page about reading web pages"}');
    const codes = codesFor(page('', head));
    expect(codes).not.toContain('structured.no-dates');
    expect(codes.filter((code) => code === 'answer.undated')).toHaveLength(1);
  });
});

describe('prose quality', () => {
  /**
   * lovable.dev's `<h1>` is the kicker "AI App Builder" and its opening says
   * "Build something Lovable", so a page stating its subject plainly took a
   * MAJOR finding. It judged writing rather than markup, which this tool cannot.
   */
  it('is never judged', () => {
    const body = '<h1>Widgets</h1>';
    expect(codesFor(page(body))).not.toContain('answer.no-standalone-opening');
  });
});

/**
 * Found by reading twenty popular pages: news, retail, health, recipes,
 * reference, government and SaaS. A corpus of developer tools and technical
 * docs never produced any of these, and two of them were catastrophic.
 */
describe('the popular-site corpus', () => {
  /**
   * edition.cnn.com carries `<div id="apple-reg-wall-btn-wrapper"></div>`. With
   * optional quotes the mount alternation matched the `app` of `apple-`, and a
   * served news front page of 1,428 words was called a JavaScript shell.
   */
  it('does not call an empty div a mount because its id starts with app', () => {
    const body = '<div id="apple-reg-wall-btn-wrapper"></div><div id="approot-thing"></div>';
    expect(codesFor(page(body))).not.toContain('access.shell');
  });

  it('still catches a real empty mount', () => {
    expect(codesFor(page('</main><div id="root"></div><main>'))).toContain('access.shell');
  });

  /**
   * edition.cnn.com canonicalises to www.cnn.com on purpose. A cross-host
   * canonical within one site is consolidation, not a giveaway, and calling it
   * a blocker put a working news front page in the top band.
   */
  it('treats another hostname on the same site as consolidation, not a giveaway', () => {
    const html = page('').replace('https://example.test/', 'https://www.example.test/');
    const codes = codesFor(html, 'https://edition.example.test/');
    expect(codes).toContain('document.canonical-elsewhere');
    expect(codes).not.toContain('document.foreign-canonical');
  });

  it('still blocks a canonical handed to a different site', () => {
    const html = page('').replace('https://example.test/', 'https://someone-else.test/');
    expect(codesFor(html)).toContain('document.foreign-canonical');
  });

  it('reads a multi-label suffix as one site', () => {
    const html = page('').replace('https://example.test/', 'https://www.example.co.uk/');
    const codes = codesFor(html, 'https://shop.example.co.uk/');
    expect(codes).not.toContain('document.foreign-canonical');
  });

  /**
   * bbcgoodfood.com ships `<link rel="profile" href="http://gmpg.org/xfn/11">`,
   * WordPress boilerplate naming a specification that no browser requests.
   */
  it('does not call a non-loading link mixed content', () => {
    const head = '<link rel="profile" href="http://gmpg.org/xfn/11">';
    expect(codesFor(page('', head))).not.toContain('document.mixed-content');
  });

  it('still reports an asset genuinely loaded over http', () => {
    const body = '<img src="http://tracker.test/pixel.gif" alt="">';
    expect(codesFor(page(body))).toContain('document.mixed-content');
  });

  /** bbc.com emits two identical canonicals; Google discards both. */
  it('reports two canonical tags even when they agree', () => {
    const head = '<link rel="canonical" href="https://example.test/">';
    expect(codesFor(page('', head))).toContain('document.multiple-canonical');
  });
});

describe('broken links', () => {
  /**
   * apple.com answers its own subpages 403 to a crawler it does not recognise.
   * Every one of those pages loads perfectly for a browser, and all ten were
   * reported as internal links leading nowhere.
   */
  it('does not call a refused link a broken one', () => {
    const refused = [401, 403, 429].map((status) => ({
      url: `https://example.test/${status}`,
      error: `Upstream responded ${status}`,
      status,
    }));
    expect(checkBrokenLinks(refused)).toHaveLength(0);
  });

  it('still reports a link that is genuinely gone', () => {
    const gone = [{ url: 'https://example.test/x', error: 'Upstream responded 404', status: 404 }];
    expect(checkBrokenLinks(gone)).toHaveLength(1);
  });

  it('still reports a link that never reached a server', () => {
    const dead = [{ url: 'https://example.test/y', error: 'getaddrinfo ENOTFOUND', status: null }];
    expect(checkBrokenLinks(dead)).toHaveLength(1);
  });
});

describe('the parser', () => {
  /**
   * cnn.com's only `<h1>` is a string inside a Handlebars template, and eight
   * of its twenty-nine headings were JavaScript. A regex scanner cannot tell a
   * template from markup, so the code comes out before anything reads elements.
   */
  it('does not read markup out of a script', () => {
    const script = `<script>var t = '<h1>Not a heading</h1><a href="/x">Not a link</a>';</script>`;
    const html = page(script);
    const codes = codesFor(html);
    expect(codes).not.toContain('document.many-h1');
    expect(codes).not.toContain('document.h1-as-style');
  });

  /**
   * apple.com/airpods writes `<img src="..." alt>` fourteen times. A bare
   * attribute is HTML5's empty attribute syntax and means `alt=""`, a
   * deliberately decorative image; requiring `alt=` called all fourteen missing.
   */
  it('accepts a bare alt attribute as the decorative marker it is', () => {
    const body = Array.from({ length: 8 }, (_, i) => `<img src="/i${i}.png" alt>`).join('');
    expect(codesFor(page(body))).not.toContain('document.missing-alt');
  });

  it('still reports images with no alt attribute at all', () => {
    const body = Array.from({ length: 8 }, (_, i) => `<img src="/i${i}.png">`).join('');
    expect(codesFor(page(body))).toContain('document.missing-alt');
  });

  /**
   * bbc.com, cnn.com and nytimes.com all declare `NewsMediaOrganization`. An
   * exact match on `Organization` missed every one of them, and three of the
   * most attributable publishers on the web were reported as naming nobody.
   */
  it('recognises an Organization subtype as a publisher', () => {
    const head =
      '<script type="application/ld+json">{"@type":"NewsMediaOrganization","name":"X"}</script>';
    expect(codesFor(page('', head))).not.toContain('structured.no-entity');
  });

  /** An empty `content` is no description, not a short one. */
  it('treats an empty description as absent rather than thin', () => {
    const html = page('').replace('How a machine reads a page, and what stops it quoting one.', '');
    const codes = codesFor(html);
    expect(codes).toContain('document.no-description');
    expect(codes).not.toContain('document.thin-description');
  });
});

/**
 * The audits added to match Lighthouse's SEO category, each verified against
 * the markup of a real page before it shipped.
 */
describe('lighthouse parity', () => {
  /** docs.python.org and microsoft.com both ship `<a href="">`. */
  it('reports an anchor with an empty href', () => {
    expect(codesFor(page('<a href="">Coroutines and tasks</a>'))).toContain(
      'document.uncrawlable-anchors',
    );
  });

  it('reports javascript:void(0) and an href-less anchor that navigates by script', () => {
    expect(codesFor(page('<a href="javascript:void(0)">Open</a>'))).toContain(
      'document.uncrawlable-anchors',
    );
    expect(codesFor(page('<a onclick="go()">Open</a>'))).toContain('document.uncrawlable-anchors');
  });

  /** A fragment resolves, and an href-less anchor with no handler is a placeholder. */
  it('leaves a fragment link and a bare anchor alone', () => {
    const body = '<a href="#main">Skip to content</a><a>Placeholder</a>';
    expect(codesFor(page(body))).not.toContain('document.uncrawlable-anchors');
  });

  /**
   * healthline.com ships `<link rel="alternate" href="[object Object]"
   * hrefLang="language_data">` and `hrefLang="default"`. Both are real defects:
   * a value no engine parses, and a template that stringified an object.
   */
  it('reports an hreflang that is not a language code', () => {
    const head = '<link rel="alternate" hreflang="language_data" href="https://a.test/">';
    expect(codesFor(page('', head))).toContain('document.invalid-hreflang');
  });

  it('reports an hreflang whose href is not absolute', () => {
    const head = '<link rel="alternate" hreflang="en" href="/en/">';
    expect(codesFor(page('', head))).toContain('document.relative-hreflang');
  });

  it('accepts a correct hreflang set, x-default included', () => {
    const head =
      '<link rel="alternate" hreflang="en-GB" href="https://a.test/en/">' +
      '<link rel="alternate" hreflang="x-default" href="https://a.test/">';
    const codes = codesFor(page('', head));
    expect(codes).not.toContain('document.invalid-hreflang');
    expect(codes).not.toContain('document.relative-hreflang');
  });

  it('says nothing about hreflang on a page that declares none', () => {
    const codes = codesFor(page(''));
    expect(codes).not.toContain('document.invalid-hreflang');
    expect(codes).not.toContain('document.relative-hreflang');
  });
});

/**
 * Two findings whose weight depends on how much of the page they cover.
 * Lighthouse fails an audit on one bad anchor because its result is pass or
 * fail; flat-rated here, a skip link costs what all-script navigation does.
 */
describe('severity grading', () => {
  function impactOf(code: string, html: string): string | null {
    const found = analyzePage(
      { url: 'https://example.test/', html },
      NO_SITE_CONTEXT,
    ).findings.find((finding) => finding.code === code);
    return found?.impact ?? null;
  }

  /** microsoft.com's skip link is one uncrawlable anchor among about a hundred. */
  it('rates a handful of uncrawlable links minor and a page built on them major', () => {
    const few = [
      '<a href="">Skip to content</a>',
      ...Array.from({ length: 12 }, (_, at) => `<a href="/p${at}">Page ${at}</a>`),
    ];
    expect(impactOf('document.uncrawlable-anchors', page(few.join('')))).toBe('minor');

    const most = Array.from(
      { length: 6 },
      (_, at) => `<a href="javascript:void(0)">Panel ${at}</a>`,
    );
    expect(impactOf('document.uncrawlable-anchors', page(most.join('')))).toBe('major');
  });

  /**
   * healthline.com's insecure asset is a comScore tracking pixel. A browser
   * declines to paint it; it refuses a script or a stylesheet outright, and
   * that can take the page with it.
   */
  it('rates an insecure pixel minor and an insecure script or stylesheet major', () => {
    expect(impactOf('document.mixed-content', page('<img src="http://b.test/p.gif" alt="">'))).toBe(
      'minor',
    );
    expect(
      impactOf('document.mixed-content', page('<script src="http://b.test/a.js"></script>')),
    ).toBe('major');
    expect(
      impactOf(
        'document.mixed-content',
        page('', '<link rel="stylesheet" href="http://b.test/a.css">'),
      ),
    ).toBe('major');
  });
});

/**
 * Pointing a duplicate at its original is what `rel=canonical` is FOR, so one
 * differing from the page's own address is not a defect. Every filtered listing
 * and `?utm_source` variant does it correctly, and a flat major charged them.
 */
describe('canonical grading', () => {
  function canonicalImpact(canonical: string, url: string): string | null {
    const html = page('').replace(
      '<link rel="canonical" href="https://example.test/">',
      `<link rel="canonical" href="${canonical}">`,
    );
    return (
      analyzePage({ url, html }, NO_SITE_CONTEXT).findings.find(
        (finding) => finding.code === 'document.canonical-mismatch',
      )?.impact ?? null
    );
  }

  it('rates a canonical at the home page major, as Lighthouse does', () => {
    expect(canonicalImpact('https://example.test/', 'https://example.test/shoes/red')).toBe(
      'major',
    );
  });

  it('rates a canonical at another content page minor', () => {
    expect(
      canonicalImpact('https://example.test/blog/post', 'https://example.test/blog/post/amp'),
    ).toBe('minor');
  });

  /** A query variant is already the same PATH, so it never reaches the rule. */
  it('says nothing about a sorted or filtered variant of the same path', () => {
    expect(
      canonicalImpact('https://example.test/shoes', 'https://example.test/shoes?sort=price'),
    ).toBe(null);
  });

  it('says nothing when the canonical is the page itself', () => {
    expect(canonicalImpact('https://example.test/shoes/', 'https://example.test/shoes')).toBe(null);
  });
});
