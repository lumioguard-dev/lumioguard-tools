// A drawn box has no depth, so elevation is reserved for what genuinely floats:
// a dialog, the enlarged screenshot. It reads as shadow cast on paper, and the
// values are per-theme because one alpha cannot suit dark stock and cream both.

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
