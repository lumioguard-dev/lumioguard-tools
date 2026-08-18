/**
 * Two faces, two registers, and which one a string gets is a decision about
 * what made it — not about emphasis.
 */
export const fontFamily = {
  hand: ['Architects Daughter', 'ui-rounded', 'cursive'],
  display: ['Architects Daughter', 'ui-rounded', 'cursive'],
  sans: ['Archivo', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
  mono: ['Archivo', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
} as const;

/** Archivo ships 400–800; Architects Daughter has a single weight. */
export const fontWeight = {
  light: 400,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 800,
} as const;

export const letterSpacing = {
  tight: '-0.05em',
  snug: '-0.02em',
  normal: '0',
  wide: '0.06em',
  wider: '0.15em',
} as const;

export const lineHeight = {
  tight: '0.82',
  snug: '1.12',
  normal: '1.55',
  loose: '1.62',
} as const;

/**
 * 12px is the floor and it is not negotiable. Slopmeter charges other pages for
 * functional text below 12px; nothing on this surface may sit under it.
 */
export const fontSizeScale = {
  12: '0.75rem',
  13: '0.8125rem',
  14: '0.875rem',
  15: '0.9375rem',
  16: '1rem',
  17: '1.0625rem',
  18: '1.125rem',
  20: '1.25rem',
  24: '1.5rem',
  30: '1.875rem',
  36: '2.25rem',
  48: '3rem',
  60: '3.75rem',
  72: '4.5rem',
  88: '5.5rem',
} as const;

export const fontSize = {
  /** The floor. Column heads, kickers, spec labels. */
  micro: ['0.75rem', { lineHeight: '1.4', letterSpacing: letterSpacing.wider }],
  caption: ['0.75rem', { lineHeight: '1.5' }],
  body: ['0.875rem', { lineHeight: lineHeight.normal }],
  h4: ['1rem', { lineHeight: '1.45' }],
  /** Panel titles, in the hand. */
  h3: ['1.25rem', { lineHeight: '1.25' }],
  /** The struck seal. */
  h2: ['1.875rem', { lineHeight: '1.08', letterSpacing: letterSpacing.wide }],
  h1: ['2.25rem', { lineHeight: lineHeight.snug }],
  /** The figure. */
  display: ['5.5rem', { lineHeight: lineHeight.tight, letterSpacing: letterSpacing.tight }],
} as const;

export type FontFamilyToken = keyof typeof fontFamily;
export type FontWeightToken = keyof typeof fontWeight;
export type FontSizeToken = keyof typeof fontSize;
