import { describe, expect, it } from 'vitest';
import { CATALOGUE, SCAN_SLUG, pageForPath, toolCopy } from '../catalogue.js';
import { TOOLS } from '../index.js';

// Descriptors spread their catalogue entry, so a label cannot differ. ORDER is the
// one thing that still could: the registry decides what a visitor sees first.

describe('CATALOGUE', () => {
  it('holds every tool the registry offers, in the order it offers them', () => {
    expect(CATALOGUE.map((tool) => tool.id)).toEqual(TOOLS.map((tool) => tool.id));
  });

  it('is the source of what each tool is called', () => {
    for (const tool of TOOLS) {
      const copy = toolCopy(tool.id);
      expect(tool.label).toBe(copy.label);
      expect(tool.summary).toBe(copy.summary);
    }
  });

  it('gives every tool a summary that is one sentence, because it is a tooltip', () => {
    for (const tool of CATALOGUE) {
      expect(tool.summary.trim().endsWith('.'), `${tool.id} is not a sentence`).toBe(true);
      expect(tool.summary.split('. ').length, `${tool.id} runs to more than one`).toBe(1);
    }
  });

  it('refuses to answer for a tool it does not have', () => {
    // A descriptor naming nothing would otherwise ship with an undefined label.
    expect(() => toolCopy('nothing')).toThrow(/nothing/);
  });
});

describe('tool pages', () => {
  it('gives every reading its own slug, headline and description', () => {
    for (const tool of CATALOGUE) {
      expect(tool.slug, `${tool.id} slug`).toMatch(/^[a-z0-9-]+$/);
      expect(tool.headline.length, `${tool.id} headline`).toBeGreaterThan(10);
      expect(tool.description.length, `${tool.id} description`).toBeLessThanOrEqual(160);
    }
    expect(new Set(CATALOGUE.map((t) => t.slug)).size).toBe(CATALOGUE.length);
    expect(new Set(CATALOGUE.map((t) => t.headline)).size).toBe(CATALOGUE.length);
  });

  it('pins a tool from its path, however the app is mounted', () => {
    for (const tool of CATALOGUE) {
      for (const path of [`/${tool.slug}`, `/tools/${tool.slug}`, `/tools/${tool.slug}.html`]) {
        const page = pageForPath(path);
        expect(page.kind, path).toBe('tool');
        expect(page.kind === 'tool' ? page.tool.id : null, path).toBe(tool.id);
      }
    }
  });

  it('pins nothing on the start page or an unknown path', () => {
    // The start page is where the picker lives; a path pinning a tool there would
    // hide it and read something nobody chose.
    for (const path of ['/', '/tools/', '/tools/index.html', '/tools/how-the-scores-work']) {
      expect(pageForPath(path).kind, path).not.toBe('tool');
    }
  });
});

describe('the chooser', () => {
  it('is the index, and anything unrecognised', () => {
    // An unknown path offers a choice rather than scanning with no reading behind it.
    for (const path of ['/', '/tools/', '/tools/index.html', '/tools/nothing-here']) {
      expect(pageForPath(path).kind, path).toBe('choose');
    }
  });

  it('is not the scan page or a tool page', () => {
    expect(pageForPath(`/tools/${SCAN_SLUG}`).kind).toBe('scan');
    for (const tool of CATALOGUE) {
      expect(pageForPath(`/tools/${tool.slug}`).kind, tool.slug).toBe('tool');
    }
  });

  it('keeps scan out of the catalogue, because it is a page and not a reading', () => {
    expect(CATALOGUE.some((tool) => tool.slug === SCAN_SLUG)).toBe(false);
  });
});
