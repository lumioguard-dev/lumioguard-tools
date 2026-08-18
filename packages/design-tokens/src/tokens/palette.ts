/** Two grounds for one world. */

export interface ColorRamp {
  readonly 50: string;
  readonly 100: string;
  readonly 200: string;
  readonly 300: string;
  readonly 400: string;
  readonly 500: string;
  readonly 600: string;
  readonly 700: string;
  readonly 800: string;
  readonly 900: string;
}

/** Named because it appears in the inferred type of exported colour groups. */
export interface Pair {
  readonly fg: string;
  readonly bg: string;
  readonly dot: string;
}

export interface Palette {
  /** The drawn line. */
  readonly pen: ColorRamp;
  /** The second pen. Index rules, the marker, charges, the stamp. */
  readonly red: ColorRamp;
  /**
   * A four-stop verdict gradient, calm → alarm, carried by the seal, the live
   * zone and the marker.
   */
  readonly band: {
    readonly calm: string;
    readonly notice: string;
    readonly warn: string;
    readonly alarm: string;
  };
  /** Grounds. `base` is the page, `sunk` is inset, `high` is lifted. */
  readonly paper: {
    readonly sunk: string;
    readonly base: string;
    readonly raised: string;
    readonly high: string;
  };
  readonly line: { readonly base: string; readonly strong: string };
  readonly mute: string;
  /**
   * 1 = primary, 3 = the floor for functional text. Nothing below ink-3 may
   * carry a label: this product charges other pages for low-contrast text, and
   * its own surface tripping that rule is a credibility defect first.
   */
  readonly ink: {
    readonly 1: string;
    readonly 2: string;
    readonly 3: string;
    readonly 4: string;
  };
  /** Hand-written ink, for the register Architects Daughter sets. */
  readonly hand: string;
  readonly severity: {
    readonly critical: Pair;
    readonly high: Pair;
    readonly medium: Pair;
    readonly low: Pair;
    readonly info: Pair;
  };
  readonly state: { readonly success: Pair; readonly danger: Pair };
  /**
   * Ruled stock. Not decoration: it is the paper every drawn box sits on, and
   * the only reason the frames read as drawn rather than as odd border-radius.
   */
  readonly rule: { readonly lined: string; readonly hatch: string };
  /**
   * Reserved for things that genuinely float. A drawn box has no depth and does
   * not pretend to.
   */
  readonly elevation: {
    readonly xs: string;
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
    readonly xl: string;
    readonly ring: string;
    readonly popover: string;
    readonly modal: string;
  };
}

export const lightPalette: Palette = {
  pen: {
    50: '#f2f5fd',
    100: '#dfe7fa',
    200: '#c3d1f4',
    300: '#1f377f',
    400: '#2b4bb0',
    500: '#3a5cc6',
    600: '#4664cc',
    700: '#93a8e2',
    800: '#b6c5ec',
    900: '#ccd8f2',
  },
  red: {
    50: '#fdeced',
    100: '#fbd7d9',
    200: '#f4b0b4',
    /** The middle weight band. */
    300: '#b04a52',
    400: '#bf242d',
    500: '#e0343d',
    600: '#cf1d27',
    700: '#c2323c',
    800: '#8f1a20',
    900: '#5c1013',
  },
  band: {
    calm: '#1a7f50',
    notice: '#3a5fc4',
    warn: '#9c5a05',
    alarm: '#c31f29',
  },
  paper: {
    sunk: '#eae6d8',
    base: '#f5f2e8',
    raised: '#fbf9f2',
    high: '#ffffff',
  },
  line: { base: '#dbe2f2', strong: '#bcc9e6' },
  mute: '#55607a',
  ink: { 1: '#151b28', 2: '#414b63', 3: '#545f78', 4: '#6f7a93' },
  hand: '#2f4fb5',
  severity: {
    critical: { fg: '#bf242d', bg: '#fbe7e8', dot: '#bf242d' },
    high: { fg: '#9c5a05', bg: '#fbf0dd', dot: '#9c5a05' },
    medium: { fg: '#2b4bb0', bg: '#e7edfb', dot: '#4664cc' },
    low: { fg: '#545f78', bg: '#fbf9f2', dot: '#55607a' },
    info: { fg: '#2b4bb0', bg: '#e7edfb', dot: '#4664cc' },
  },
  state: {
    success: { fg: '#1a7f50', bg: '#e2f3ea', dot: '#1a7f50' },
    danger: { fg: '#bf242d', bg: '#fbe7e8', dot: '#cf1d27' },
  },
  rule: {
    // Paper takes a fainter rule than dark stock: the same alpha that reads as
    // a feint line on #0a0d16 reads as a stripe on cream.
    lined: 'repeating-linear-gradient(to bottom, transparent 0 27px, #4664cc0c 27px 28px)',
    hatch: 'repeating-linear-gradient(45deg, transparent 0 7px, #4664cc0a 7px 14px)',
  },
  elevation: {
    xs: '0 1px 2px rgba(30, 39, 64, 0.1)',
    sm: '0 2px 6px rgba(30, 39, 64, 0.12), 0 1px 2px rgba(30, 39, 64, 0.08)',
    md: '0 8px 24px rgba(30, 39, 64, 0.14), 0 2px 6px rgba(30, 39, 64, 0.09)',
    lg: '0 20px 40px rgba(30, 39, 64, 0.18), 0 6px 12px rgba(30, 39, 64, 0.1)',
    xl: '0 30px 60px rgba(30, 39, 64, 0.22)',
    ring: '0 0 0 3px rgba(70, 100, 204, 0.42)',
    popover: '0 8px 24px rgba(30, 39, 64, 0.14), 0 2px 6px rgba(30, 39, 64, 0.09)',
    modal: '0 20px 40px rgba(30, 39, 64, 0.18), 0 6px 12px rgba(30, 39, 64, 0.1)',
  },
};

export const darkPalette: Palette = {
  pen: {
    50: '#eef3fd',
    100: '#d8e4fb',
    200: '#bcd0f8',
    300: '#9dbcfa',
    400: '#8fb0f5',
    500: '#6f92e8',
    600: '#5f80d8',
    700: '#3d5290',
    800: '#2c3757',
    900: '#1e2740',
  },
  red: {
    50: '#fdeced',
    100: '#fbd4d7',
    200: '#f8adb2',
    300: '#f4858c',
    400: '#f0525a',
    500: '#e0343d',
    600: '#d81e28',
    700: '#c2323c',
    800: '#8f1a20',
    900: '#5c1013',
  },
  band: {
    calm: '#35b57b',
    notice: '#6f92e8',
    warn: '#e08b2b',
    alarm: '#f0525a',
  },
  paper: {
    sunk: '#070a12',
    base: '#0a0d16',
    raised: '#0e1322',
    high: '#131a2e',
  },
  line: { base: '#1e2740', strong: '#2c3757' },
  mute: '#818cab',
  ink: { 1: '#e8ecf7', 2: '#9aa4bf', 3: '#818cab', 4: '#68738f' },
  hand: '#9dbcfa',
  severity: {
    critical: { fg: '#f0525a', bg: '#2a1216', dot: '#f0525a' },
    high: { fg: '#e08b2b', bg: '#291d0d', dot: '#e08b2b' },
    medium: { fg: '#8fb0f5', bg: '#111a33', dot: '#6f92e8' },
    low: { fg: '#818cab', bg: '#0e1322', dot: '#818cab' },
    info: { fg: '#8fb0f5', bg: '#111a33', dot: '#6f92e8' },
  },
  state: {
    success: { fg: '#35b57b', bg: '#0c2019', dot: '#35b57b' },
    danger: { fg: '#f0525a', bg: '#2a1216', dot: '#d81e28' },
  },
  rule: {
    lined: 'repeating-linear-gradient(to bottom, transparent 0 27px, #5f80d81a 27px 28px)',
    hatch: 'repeating-linear-gradient(45deg, transparent 0 7px, #5f80d81f 7px 14px)',
  },
  elevation: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.34)',
    sm: '0 2px 6px rgba(0, 0, 0, 0.42), 0 1px 2px rgba(0, 0, 0, 0.32)',
    md: '0 8px 24px rgba(0, 0, 0, 0.52), 0 2px 6px rgba(0, 0, 0, 0.34)',
    lg: '0 20px 40px rgba(0, 0, 0, 0.58), 0 6px 12px rgba(0, 0, 0, 0.4)',
    xl: '0 30px 60px rgba(0, 0, 0, 0.66)',
    ring: '0 0 0 3px rgba(111, 146, 232, 0.55)',
    popover: '0 8px 24px rgba(0, 0, 0, 0.52), 0 2px 6px rgba(0, 0, 0, 0.34)',
    modal: '0 20px 40px rgba(0, 0, 0, 0.58), 0 6px 12px rgba(0, 0, 0, 0.4)',
  },
};

export type ThemeName = 'light' | 'dark';

export const THEME_ATTRIBUTE = 'data-theme';
export const THEME_STORAGE_KEY = 'slopmeter-theme';
export const DEFAULT_THEME: ThemeName = 'light';

type Branch = { readonly [key: string]: string | Branch };

function walk(
  node: Branch,
  path: readonly string[],
  visit: (name: string, value: string) => void,
): void {
  for (const [key, value] of Object.entries(node)) {
    const next = [...path, key];
    if (typeof value === 'string') visit(`--${next.join('-')}`, value);
    else walk(value, next, visit);
  }
}

/** `{ '--pen-600': '#4664cc', ... }` for one theme's `:root` block. */
export function cssVariablesFor(palette: Palette): Record<string, string> {
  const out: Record<string, string> = {};
  walk(palette as unknown as Branch, [], (name, value) => {
    out[name] = value;
  });
  return out;
}

function mirror(node: Branch, path: readonly string[]): Branch {
  const out: Record<string, string | Branch> = {};
  for (const [key, value] of Object.entries(node)) {
    const next = [...path, key];
    out[key] = typeof value === 'string' ? `var(--${next.join('-')})` : mirror(value, next);
  }
  return out;
}

/**
 * The same shape, every leaf replaced by the `var()` that points at it. This is
 * what the app imports, so a token is theme-aware wherever it is used, in a
 * Tailwind class or in an inline style.
 */
export const tokenRefs: Palette = mirror(
  lightPalette as unknown as Branch,
  [],
) as unknown as Palette;
