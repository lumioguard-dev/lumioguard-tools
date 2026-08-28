// 6 chips / 10 controls / 14 panels / 22 floating.
export const radii = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '16px',
  '2xl': '22px',
  full: '9999px',
} as const;

export const drawn = {
  a: '11px 3px 9px 4px / 4px 10px 3px 11px',
  b: '3px 10px 4px 11px / 9px 4px 11px 3px',
  c: '9px 4px 11px 3px / 3px 11px 4px 10px',
  d: '4px 11px 3px 9px / 10px 3px 9px 4px',
  field: '9px 3px 8px 4px / 4px 8px 3px 9px',
  chip: '7px 2px 6px 3px / 3px 6px 2px 7px',
  bar: '4px 2px 3px 2px / 2px 3px 2px 4px',
} as const;

/** The four box hands, in cycle order. */
export const drawnCycle = [drawn.a, drawn.b, drawn.c, drawn.d] as const;

export type RadiusToken = keyof typeof radii;
export type DrawnToken = keyof typeof drawn;
