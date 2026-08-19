import { describe, expect, it } from 'vitest';
import { band, colors, ink, paper, pen, red, severity, state } from '../tokens/colors.js';
import { THEME_ATTRIBUTE, cssVariablesFor, darkPalette, lightPalette } from '../tokens/palette.js';

/**
 * The token contract, which is easier to break than it looks.
 *
 * Every colour export is a `var()` string pointing at a custom property the
 * palette emits per theme. That is what lets an inline style follow the theme
 * without the component knowing a theme exists, and it is also why arithmetic
 * on one is silently fatal: appending hex alpha produces `var(--x)16`, which is
 * not a colour, and paints nothing at all.
 */

function everyLeaf(value: unknown, path: string[] = []): Array<[string, string]> {
  if (typeof value === 'string') return [[path.join('.'), value]];
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => everyLeaf(child, [...path, key]));
  }
  return [];
}

const ALL_COLOURS = everyLeaf(colors);

describe('colour tokens', () => {
  it('exports a non-empty set', () => {
    expect(ALL_COLOURS.length).toBeGreaterThan(20);
  });

  // The property that makes theming work at all.
  it.each(ALL_COLOURS)('%s is a var() reference, not a literal', (_name, value) => {
    expect(value).toMatch(/^var\(--[a-z0-9-]+\)$/i);
  });

  // A hex literal here would be a colour that cannot follow the theme: correct
  // in light, wrong in dark, and invisible in review.
  it('contains no hex literals', () => {
    const literals = ALL_COLOURS.filter(([, value]) => /#[0-9a-f]{3,8}\b/i.test(value));
    expect(literals).toEqual([]);
  });

  it('keeps the registers that carry the system', () => {
    for (const ramp of [pen, red, band, ink, paper, severity, state]) {
      expect(Object.keys(ramp).length).toBeGreaterThan(0);
    }
  });
});

describe('the two palettes', () => {
  const light = cssVariablesFor(lightPalette);
  const dark = cssVariablesFor(darkPalette);

  // The failure this catches is a token defined in one theme only: it resolves
  // to nothing in the other, and the element paints with no colour rather than
  // an obviously wrong one.
  it('define exactly the same custom properties', () => {
    expect(Object.keys(light).sort()).toEqual(Object.keys(dark).sort());
  });

  it('give every custom property a value in both themes', () => {
    for (const [name, value] of Object.entries(light)) {
      expect(String(value).trim(), `${name} is empty in light`).not.toBe('');
    }
    for (const [name, value] of Object.entries(dark)) {
      expect(String(value).trim(), `${name} is empty in dark`).not.toBe('');
    }
  });

  it('every var() a token points at is actually emitted', () => {
    const emitted = new Set(Object.keys(light));
    for (const [name, value] of ALL_COLOURS) {
      const property = /^var\((--[^)]+)\)$/.exec(value)?.[1];
      expect(property, `${name} is not a var()`).toBeTruthy();
      expect(emitted.has(String(property)), `${name} points at ${property}, never emitted`).toBe(
        true,
      );
    }
  });

  // Dark is reached by an explicit choice written to the document, never by the
  // operating system: light is the default and a media query would override it.
  it('are switched by a document attribute rather than a media query', () => {
    expect(THEME_ATTRIBUTE).toMatch(/^data-/);
  });

  it('actually differ, so the dark theme is not a copy', () => {
    const changed = Object.keys(light).filter((name) => light[name] !== dark[name]);
    expect(changed.length).toBeGreaterThan(5);
  });
});
