import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

import { breakpoints } from '../tokens/breakpoints.js';
import {
  band,
  hand,
  ink,
  line,
  mute,
  paper,
  pen,
  red,
  rule,
  severity,
  state,
} from '../tokens/colors.js';
import { elevations } from '../tokens/elevations.js';
import { THEME_ATTRIBUTE, cssVariablesFor, darkPalette, lightPalette } from '../tokens/palette.js';
import { drawn, radii } from '../tokens/radii.js';
import { spacing, spacingScale } from '../tokens/spacing.js';
import {
  fontFamily,
  fontSize,
  fontSizeScale,
  fontWeight,
  letterSpacing,
  lineHeight,
} from '../tokens/typography.js';

function flattenPairs(
  group: Record<string, { readonly fg: string; readonly bg: string; readonly dot: string }>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, pair] of Object.entries(group)) {
    out[`${name}-fg`] = pair.fg;
    out[`${name}-bg`] = pair.bg;
    out[`${name}-dot`] = pair.dot;
  }
  return out;
}

const colorTheme: Record<string, string | Record<string, string>> = {
  pen: { ...pen },
  red: { ...red },
  band: { ...band },
  ink: { ...ink },
  paper: { ...paper },
  line: { ...line },
  mute,
  hand,
  severity: flattenPairs(severity),
  state: flattenPairs(state),
};

type FontSizeTuple = [string, { lineHeight: string; letterSpacing?: string }];

function toTuple(
  entry: readonly [string, { readonly lineHeight: string; readonly letterSpacing?: string }],
): FontSizeTuple {
  const [size, config] = entry;
  const out: FontSizeTuple[1] = { lineHeight: config.lineHeight };
  if (config.letterSpacing !== undefined) out.letterSpacing = config.letterSpacing;
  return [size, out];
}

export const designTokensPlugin = plugin(
  ({ addBase }) => {
    /*
     * Light on the bare root, so it is what a surface gets before anything has
     * been chosen. Dark is reached only by an explicit choice written to the
     * document, never by the operating system.
     */
    addBase({
      ':root': cssVariablesFor(lightPalette),
      [`:root[${THEME_ATTRIBUTE}="dark"]`]: cssVariablesFor(darkPalette),
    });
  },
  {
    theme: {
      extend: {
        screens: { ...breakpoints },
        colors: colorTheme,
        backgroundImage: {
          'rule-lined': rule.lined,
          'rule-hatch': rule.hatch,
        },
        fontFamily: {
          hand: [...fontFamily.hand],
          display: [...fontFamily.display],
          headline: [...fontFamily.headline],
          sans: [...fontFamily.sans],
          mono: [...fontFamily.mono],
        },
        fontSize: {
          ...fontSizeScale,
          micro: toTuple(fontSize.micro),
          caption: toTuple(fontSize.caption),
          body: toTuple(fontSize.body),
          h4: toTuple(fontSize.h4),
          h3: toTuple(fontSize.h3),
          h2: toTuple(fontSize.h2),
          h1: toTuple(fontSize.h1),
          display: toTuple(fontSize.display),
        },
        fontWeight: {
          light: String(fontWeight.light),
          regular: String(fontWeight.regular),
          medium: String(fontWeight.medium),
          semibold: String(fontWeight.semibold),
          bold: String(fontWeight.bold),
          extrabold: String(fontWeight.extrabold),
          black: String(fontWeight.black),
        },
        spacing: { ...spacingScale, ...spacing },
        borderRadius: {
          'radius-sm': radii.sm,
          'radius-md': radii.md,
          'radius-lg': radii.lg,
          'radius-xl': radii.xl,
          'radius-2xl': radii['2xl'],
          'radius-full': radii.full,
          'drawn-a': drawn.a,
          'drawn-b': drawn.b,
          'drawn-c': drawn.c,
          'drawn-d': drawn.d,
          'drawn-field': drawn.field,
          'drawn-chip': drawn.chip,
          'drawn-bar': drawn.bar,
        },
        boxShadow: {
          'elev-xs': elevations.xs,
          'elev-sm': elevations.sm,
          'elev-md': elevations.md,
          'elev-lg': elevations.lg,
          'elev-xl': elevations.xl,
          'elev-popover': elevations.popover,
          'elev-modal': elevations.modal,
          'elev-ring': elevations.ring,
        },
        letterSpacing: { ...letterSpacing },
        lineHeight: { ...lineHeight },
        keyframes: {
          'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
          'sweep-in': {
            from: { opacity: '0', transform: 'translateY(8px)' },
            to: { opacity: '1', transform: 'translateY(0)' },
          },
        },
        animation: {
          'fade-in': 'fade-in 200ms cubic-bezier(0.2, 0, 0, 1) both',
          'sweep-in': 'sweep-in 340ms cubic-bezier(0.2, 0, 0, 1) both',
        },
      },
    },
  } satisfies Partial<Config>,
);

export default designTokensPlugin;
