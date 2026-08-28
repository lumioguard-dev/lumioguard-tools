import { describe, expect, it } from 'vitest';
import { PAGES } from '../../src/pages.js';
import { CONTENT_PAGES } from '../pages/content.js';
import { renderPage } from '../pages/render.js';

const ORIGIN = 'https://example.test';
const ROOT = { base: ORIGIN, path: '' };

// The explainers exist to be findable, so what is asserted is what decides whether
// they can be: one heading each, real prose, links out, and metadata that is theirs.

describe('the page register', () => {
  it('has prose for every registered page, and no page without a link', () => {
    expect(CONTENT_PAGES.map((page) => page.meta.path)).toEqual(PAGES.map((page) => page.path));
  });

  it('gives every page a rooted path, which is what the emitted file is named from', () => {
    for (const page of PAGES) {
      expect(page.path.startsWith('/'), `${page.path} is not rooted`).toBe(true);
      expect(page.path.endsWith('/'), `${page.path} has a trailing slash`).toBe(false);
    }
  });

  it('gives every page its own title and description', () => {
    // Two pages sharing either is `document.duplicate-title`, and a search
    // engine picking between them picks one and drops the other.
    expect(new Set(PAGES.map((page) => page.title)).size).toBe(PAGES.length);
    expect(new Set(PAGES.map((page) => page.description)).size).toBe(PAGES.length);
  });

  it('keeps every title and description inside what a search result shows', () => {
    for (const page of PAGES) {
      expect(page.title.length, `${page.path} title`).toBeLessThanOrEqual(75);
      expect(page.description.length, `${page.path} description`).toBeGreaterThanOrEqual(25);
    }
  });
});

describe('a rendered page', () => {
  for (const page of CONTENT_PAGES) {
    describe(page.meta.path, () => {
      const html = renderPage(page, ROOT, true);

      it('has exactly one h1, and it is the title', () => {
        // `document.many-h1` and `document.no-h1` both sit on this.
        const h1 = [...html.matchAll(/<h1>([\s\S]*?)<\/h1>/g)];
        expect(h1).toHaveLength(1);
        expect(h1[0]?.[1]).toContain(page.meta.title.replace(/&/g, '&amp;'));
      });

      it('carries enough prose to be worth reading', () => {
        const words = html
          .replace(/<(style|script)[\s\S]*?<\/\1>/g, ' ')
          .replace(/<[^>]+>/g, ' ')
          .trim()
          .split(/\s+/);
        expect(words.length, `${page.meta.path} is thin`).toBeGreaterThan(300);
      });

      it('declares its language, and its own canonical', () => {
        expect(html).toContain('<html lang="en">');
        expect(html).toContain(`<link rel="canonical" href="${ORIGIN}${page.meta.path}" />`);
      });

      it('links back to the app and out to its siblings', () => {
        expect(html).toContain('href="/"');
        for (const sibling of PAGES) {
          if (sibling.path === page.meta.path) continue;
          expect(html, `no link to ${sibling.path}`).toContain(`href="${sibling.path}"`);
        }
      });

      it('carries no meter, because the verdict lives on one surface', () => {
        expect(html).not.toContain('/ 100');
        expect(html).not.toMatch(/\bscore\b\s*[:=]/i);
      });

      it('escapes markup rather than emitting it', () => {
        expect(html).not.toMatch(/&(?![a-z]+;|#\d+;)/i);
      });
    });
  }
});

describe('the published ladders', () => {
  const scores = CONTENT_PAGES.find((page) => page.meta.path === '/how-the-scores-work');

  it('are read from the constants, so a retuned band moves the page with it', () => {
    const tables = (scores?.sections ?? []).flatMap((section) =>
      section.table === undefined ? [] : [section.table],
    );
    expect(tables.length).toBeGreaterThanOrEqual(3);
    for (const table of tables) {
      // Four bands apiece, every row a band name, a range and a meaning.
      expect(table.rows).toHaveLength(4);
      for (const row of table.rows) expect(row).toHaveLength(table.head.length);
    }
  });

  it('names a range that ends at the top of the scale', () => {
    const table = (scores?.sections ?? []).flatMap((s) => (s.table ? [s.table] : []))[0];
    expect(table?.rows[0]?.[1]).toMatch(/-100$/);
  });
});

describe('mounted under a path', () => {
  const MOUNTED = { base: `${ORIGIN}/tools`, path: '/tools' };
  const page = CONTENT_PAGES[0];
  if (page === undefined) throw new Error('no content pages');
  const html = renderPage(page, MOUNTED, true);

  it('canonicalises to the mounted URL, not the host root', () => {
    expect(html).toContain(`<link rel="canonical" href="${ORIGIN}/tools${page.meta.path}" />`);
  });

  it('carries the mount point on every in-site link', () => {
    // A link to `/` from a page mounted at /tools lands on the HOST's home
    // page, not the app's, which is a dead end the canonical then denies.
    expect(html).toContain('href="/tools/"');
    for (const sibling of PAGES) {
      if (sibling.path === page.meta.path) continue;
      expect(html, `no mounted link to ${sibling.path}`).toContain(`href="/tools${sibling.path}"`);
    }
    expect(html).not.toMatch(/href="\/(?!tools)/);
  });
});
