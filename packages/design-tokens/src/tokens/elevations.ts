// This world is flat print: a drawn box has no depth and does not pretend to.
// Elevation is reserved for things that genuinely float: the enlarged
// screenshot, a dialog, and reads as shadow cast on paper, not glow. A
// zero-offset coloured halo is decoration, and this product charges other pages
// for it.
//
// The values are per-theme: a near-black shadow is invisible on dark stock at
// low alpha and far too heavy on paper, so each ground carries its own.

import { tokenRefs } from './palette.js';

export const elevations = {
  none: 'none',
  xs: tokenRefs.elevation.xs,
  sm: tokenRefs.elevation.sm,
  md: tokenRefs.elevation.md,
  lg: tokenRefs.elevation.lg,
  xl: tokenRefs.elevation.xl,
  /** Focus. Pen blue, because focus is the surface answering you. */
  ring: tokenRefs.elevation.ring,
  popover: tokenRefs.elevation.popover,
  modal: tokenRefs.elevation.modal,
} as const;

export type ElevationToken = keyof typeof elevations;
