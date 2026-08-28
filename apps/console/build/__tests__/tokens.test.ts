import { hand, ink, lightPalette, line, paper } from '@lumioguard/design-tokens';
import { describe, expect, it } from 'vitest';
import {
  CSS_HAND,
  CSS_INK_1,
  CSS_INK_2,
  CSS_INK_3,
  CSS_LINE_BASE,
  CSS_PAPER_BASE,
} from '../tokens.js';

// `build/tokens.ts` copies these out of the palette because plain Node loads it.
// Retune a colour and the crawler's document would otherwise keep the old one.
const FALLBACKS: readonly (readonly [string, string, string])[] = [
  ['ink 1', CSS_INK_1, ink[1]],
  ['ink 2', CSS_INK_2, ink[2]],
  ['ink 3', CSS_INK_3, ink[3]],
  ['hand', CSS_HAND, hand],
  ['paper base', CSS_PAPER_BASE, paper.base],
  ['line base', CSS_LINE_BASE, line.base],
];

const VALUES: Readonly<Record<string, string>> = {
  'ink 1': lightPalette.ink[1],
  'ink 2': lightPalette.ink[2],
  'ink 3': lightPalette.ink[3],
  hand: lightPalette.hand,
  'paper base': lightPalette.paper.base,
  'line base': lightPalette.line.base,
};

describe('the build-time colour fallbacks', () => {
  it.each(FALLBACKS)('%s names the same custom property the token does', (name, css, reference) => {
    // `var(--ink-1)` from the token, `var(--ink-1,#151b28)` here: same property.
    expect(css.startsWith(reference.replace(/\)$/, ''))).toBe(true);
    expect(VALUES[name]).toBeDefined();
  });

  it.each(FALLBACKS)('%s falls back to the light palette’s own colour', (name, css) => {
    expect(css).toBe(`${css.slice(0, css.indexOf(','))},${VALUES[name]})`);
  });
});
