import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CATALOGUE, SCAN_SLUG, leaderboardPath, pageForPath } from '../../src/tools/catalogue.js';
import { DOCUMENTS, documentFor } from '../documents.js';

/** Normalised, because Windows checks this out CRLF and the build does not care. */
const ENTRY = readFileSync(
  fileURLToPath(new URL('../../index.html', import.meta.url)),
  'utf8',
).replace(/\r\n/g, '\n');

describe('the entry document', () => {
  it('is the only one in the app root, and carries every anchor', () => {
    for (const anchor of ['<!--seo:head-->', '<!--seo:chrome-->', '<div id="root"></div>']) {
      expect(ENTRY).toContain(anchor);
    }
  });

  /** Empty, `#root` is `access.shell`: the blocker this repo's own tool ships. */
  it('mounts an empty root that the build fills', () => {
    expect(ENTRY).toContain('<div id="root"></div>');
    expect(ENTRY).toContain('/src/main.tsx');
  });
});

describe('the documents written from it', () => {
  it('is one per page in the catalogue, and no more', () => {
    expect(DOCUMENTS.map((document) => document.file).sort()).toEqual(
      [
        'index.html',
        `${SCAN_SLUG}.html`,
        `${leaderboardPath().replace(/^\//, '')}.html`,
        ...CATALOGUE.map((tool) => `${tool.slug}.html`),
      ].sort(),
    );
  });

  // The nesting that used to need a folder in the app root is a filename here.
  it('keeps the board under the reading it ranks', () => {
    const board = DOCUMENTS.find((document) => document.url === leaderboardPath());
    expect(board?.file).toBe('ai-slop-check/leaderboard.html');
  });

  // Each document carries its OWN title and canonical, which is why they are not
  // one file served at every URL.
  it('gives every document a path that resolves to a different page', () => {
    const kinds = DOCUMENTS.map((document) => {
      const page = pageForPath(document.url);
      return page.kind === 'tool' ? page.tool.slug : page.kind;
    });
    expect(new Set(kinds).size).toBe(DOCUMENTS.length);
  });

  it('answers the dev server for every url it emits, with or without a trailing slash', () => {
    for (const document of DOCUMENTS) {
      expect(documentFor(document.url), document.url).toEqual(document);
      expect(documentFor(`${document.url}/`), `${document.url}/`).toEqual(document);
    }
  });

  it('leaves an unknown path to the rest of the server', () => {
    expect(documentFor('/nope')).toBeUndefined();
    expect(documentFor('/assets/main.js')).toBeUndefined();
  });
});
