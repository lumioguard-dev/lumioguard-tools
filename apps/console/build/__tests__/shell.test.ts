import { describe, expect, it } from 'vitest';
import { DESCRIPTION, EXAMPLES, HEADLINE_TEXT, SCAN } from '../../src/copy.js';
import { CATALOGUE } from '../../src/tools/catalogue.js';
import { staticShell } from '../shell.js';

/**
 * Asserted as properties of the markup, never by running Citecheck over it: the
 * console may not import a detection engine, and a test is still the console.
 * The rules these stand in for are named where they are not obvious.
 */

describe('staticShell', () => {
  const shell = staticShell('');

  it('leaves the mount point holding a document rather than nothing', () => {
    // `<div id="root"></div>`, closed and empty, is what `access.shell` matches,
    // and one blocker pins the page into the bottom band on its own.
    expect(`<div id="root">${shell}</div>`).not.toMatch(/<div id="root">\s*<\/div>/);
    expect(shell).toContain('<h1>');
  });

  it('carries the heading the app renders, word for word', () => {
    expect(shell).toContain(HEADLINE_TEXT);
  });

  it('leaves the description to the head, as the rendered chooser does', () => {
    // The chooser shows its heading and the choices, and nothing else. The
    // served document has to agree: prose here that React does not render is
    // the served-versus-rendered gap `access.agent-thin` reports.
    expect(shell).not.toContain(DESCRIPTION);
  });

  it('gives a scanning page its own heading and no more', () => {
    // No page renders a blurb under the heading any more, so no document
    // carries one: served prose the reader never sees is `access.agent-thin`.
    const tool = CATALOGUE[0];
    if (tool === undefined) throw new Error('no tools');
    expect(staticShell('', { kind: 'scan' })).toContain(SCAN.headline);
    expect(staticShell('', { kind: 'scan' })).not.toContain(SCAN.description);
    expect(staticShell('', { kind: 'tool', tool })).toContain(tool.headline);
    expect(staticShell('', { kind: 'tool', tool })).not.toContain(tool.description);
  });

  it('names every reading, describes it, and links to each', () => {
    // The text a reader ends up with, not the markup: the ampersand in
    // "SEO & AI visibility" is `&amp;` on the way through.
    const text = shell.replace(/&amp;/g, '&');
    for (const tool of CATALOGUE) {
      expect(text, `${tool.id} is not in the served document`).toContain(tool.label);
      expect(text, `${tool.id} has no summary`).toContain(tool.summary);
      expect(text, `${tool.id} is not linked`).toContain(`href="/${tool.slug}"`);
    }
  });

  it('links somewhere, using addresses the app can open', () => {
    // `document.no-links`: a page with none is one a crawler cannot leave.
    for (const site of EXAMPLES) {
      expect(shell).toContain(`href="/?site=${site}"`);
    }
  });

  it('gives every link text naming where it goes', () => {
    // `document.vague-anchors`: text saying nothing about its target.
    const texts = [...shell.matchAll(/<a\b[^>]*>([^<]*)<\/a>/g)].map((match) => match[1] ?? '');
    expect(texts.length).toBeGreaterThan(0);
    for (const text of texts) {
      expect(text.trim().length, `"${text}" is too short to say where it goes`).toBeGreaterThan(4);
      expect(text.toLowerCase()).not.toMatch(/^(click here|here|read more|learn more|more)$/);
    }
  });

  it('has enough prose to be a document', () => {
    const words = shell
      .replace(/<style>[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .trim()
      .split(/\s+/);
    // Citecheck's floor for "no readable content at all" is 12 words of the
    // whole body. The chooser is terse now, so what matters is that it clears
    // the floor with real words rather than a placeholder that happens to pass.
    expect(words.length).toBeGreaterThan(70);
  });

  it('escapes markup rather than emitting it', () => {
    expect(shell).toContain('SEO &amp; AI visibility');
    expect(shell).not.toMatch(/&(?![a-z]+;|#\d+;)/i);
  });
});

describe('staticShell mounted under a path', () => {
  const shell = staticShell('/tools');

  it('carries the mount point on every link it writes', () => {
    expect(shell).toContain('href="/tools/?site=');
    expect(shell).not.toMatch(/href="\/(?!tools)/);
  });
});
