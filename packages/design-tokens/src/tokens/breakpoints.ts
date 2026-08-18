// Aligned to Tailwind's default ramp so `sm:`/`md:`/`lg:` behave as expected.
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export type BreakpointToken = keyof typeof breakpoints;
