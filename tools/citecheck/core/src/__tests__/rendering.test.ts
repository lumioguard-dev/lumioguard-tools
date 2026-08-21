import { describe, expect, it } from 'vitest';
import { readRendering } from '../access/rendering.js';
import { PageDocument } from '../read/PageDocument.js';

const URL_UNDER_TEST = 'https://example.test/';

function read(html: string): ReturnType<typeof readRendering> {
  return readRendering(PageDocument.read({ url: URL_UNDER_TEST, html }));
}

/** Enough prose that no length rule can be what decides the outcome. */
const PROSE = `<p>${'A sentence about the subject of this page. '.repeat(12)}</p>`;

describe('rendering', () => {
  it('calls an empty mount a shell', () => {
    const result = read(
      '<html><body><div id="root"></div><script src="/a.js"></script></body></html>',
    );
    expect(result.rendering).toBe('shell');
    expect(result.findings.map((f) => f.code)).toEqual(['access.shell']);
  });

  /**
   * The false positive this check has to survive. A server-rendered Next.js page
   * has the same mount id as an empty one, and keying on the id alone reported
   * every server-rendered site as invisible.
   */
  it('does not call a full mount a shell', () => {
    const result = read(
      `<html><body><div id="__next"><h1>Title</h1>${PROSE}</div><script>window.__NEXT_DATA__={}</script></body></html>`,
    );
    expect(result.rendering).toBe('hydrated');
    expect(result.findings).toHaveLength(0);
  });

  /**
   * The other false positive: a genuinely short static page is short, not
   * absent. The word floor only applies where a framework marker is also there.
   */
  it('does not call a short static page a shell', () => {
    const result = read('<html><body><h1>Contact</h1><p>Write to us.</p></body></html>');
    expect(result.rendering).toBe('served');
    expect(result.findings).toHaveLength(0);
  });

  it('calls a framework page with no prose a shell', () => {
    const result = read(
      '<html><body><div id="app"><span>Loading</span></div><script>window.__NEXT_DATA__={}</script></body></html>',
    );
    expect(result.rendering).toBe('shell');
  });
});

describe('the content region', () => {
  /** `<main>` is the author saying where their content is, so it wins outright. */
  it('prefers main over stripping the chrome', () => {
    const page = PageDocument.read({
      url: URL_UNDER_TEST,
      html: '<body><nav>Home About Pricing</nav><main><p>The content.</p></main><footer>Legal</footer></body>',
    });
    expect(page.contentText).toBe('The content.');
    expect(page.text).toContain('Home About Pricing');
  });

  it('falls back to cutting the chrome when there is no main', () => {
    const page = PageDocument.read({
      url: URL_UNDER_TEST,
      html: '<body><header>Menu</header><p>The content.</p><footer>Legal</footer></body>',
    });
    expect(page.contentText).toBe('The content.');
  });

  it('never counts script or style bodies as page text', () => {
    const page = PageDocument.read({
      url: URL_UNDER_TEST,
      html: '<body><script>const secret = "notprose";</script><p>Prose.</p></body>',
    });
    expect(page.text).toBe('Prose.');
  });
});
