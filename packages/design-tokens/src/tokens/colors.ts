// Ballpoint in two grounds.
//
// Two registers carry the whole system and the split is load-bearing: `pen`
// blue is what was written by hand, `ink` greys are what was printed by a
// machine, and `red` is the second pen: index rules, markers, charges, stamps.
//
// Every export here is a `var()` reference; the values live in palette.ts, one
// set per theme. Import these anywhere, including inline styles, and the theme
// follows. Never concatenate onto one of these strings.

import { type Palette, tokenRefs } from './palette.js';

export type { ColorRamp, Palette } from './palette.js';

export const pen = tokenRefs.pen;
export const red = tokenRefs.red;
export const band = tokenRefs.band;
export const paper = tokenRefs.paper;
export const line = tokenRefs.line;
export const mute = tokenRefs.mute;
export const ink = tokenRefs.ink;
export const hand = tokenRefs.hand;
export const severity = tokenRefs.severity;
export const state = tokenRefs.state;
export const rule = tokenRefs.rule;

export const colors = {
  pen,
  red,
  band,
  paper,
  line,
  mute,
  ink,
  hand,
  severity,
  state,
  rule,
} as const;

export type Colors = typeof colors;
export type SeverityToken = keyof Palette['severity'];
export type StateToken = keyof Palette['state'];
export type BandToken = keyof Palette['band'];
