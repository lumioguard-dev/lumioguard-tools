import { AnalysisLimits } from './Limits.js';

/**
 * An inline sheet a framework generated, not the author. React Native Web
 * preallocates one: 62.5KB and 1540 rules on twitter.com against 6KB of class
 * attributes used, which credited X with gradients and glows it never paints.
 */
const FRAMEWORK_SHEET = /react-native-stylesheet|\[stylesheet-group/i;

/** A CDN drop-in ships every utility class whether the page uses it or not. */
const CDN_UTILITY_FRAMEWORK =
  /cdn\.tailwindcss\.com|unpkg\.com\/tailwindcss|jsdelivr\.net\/npm\/tailwindcss|bootstrap[.@][\d.]*\/dist\/css/i;

/**
 * Removes what a sheet contains but does not paint: `@keyframes` bodies, and
 * custom-property declarations, without which `--x-box-shadow:` reads as
 * `box-shadow:`. `var(--x)` references survive: they have no colon.
 */
function stripNonPainting(css: string): string {
  return css
    .replace(/@(?:-\w+-)?keyframes\b[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/gi, ' ')
    .replace(/--[\w-]+\s*:[^;}]*/g, ' ');
}

/** The naive `[^{}]` split is load-bearing, so it is stated once. */
function* blockBodies(css: string): Generator<string> {
  const blockPattern = /\{([^{}]*)\}/g;
  for (let match = blockPattern.exec(css); match !== null; match = blockPattern.exec(css)) {
    yield match[1] ?? '';
  }
}

export class StyleSheets {
  /** Inline `<style>` written for this page, framework sheets excluded. */
  public readonly authorCss: string;
  public readonly bundleCss: string;
  public readonly shipsEveryUtility: boolean;

  private appliedCache: string | null = null;
  private allCache: string | null = null;
  private lowerCache: string | null = null;
  private authorPaintingCache: string | null = null;

  private constructor(init: { authorCss: string; bundleCss: string; shipsEveryUtility: boolean }) {
    this.authorCss = init.authorCss;
    this.bundleCss = init.bundleCss;
    this.shipsEveryUtility = init.shipsEveryUtility;
  }

  public static from(html: string, linkedSheets: readonly string[]): StyleSheets {
    const blocks = [...html.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi)];
    const authored = blocks.filter(
      (m) => !FRAMEWORK_SHEET.test(m[1] ?? '') && !FRAMEWORK_SHEET.test(m[2] ?? ''),
    );

    return new StyleSheets({
      authorCss: authored
        .map((m) => m[2] ?? '')
        .join('\n')
        .slice(0, AnalysisLimits.maxCssBytes),
      bundleCss: linkedSheets.join('\n').slice(0, AnalysisLimits.maxCssBytes),
      shipsEveryUtility: authored.length !== blocks.length || CDN_UTILITY_FRAMEWORK.test(html),
    });
  }

  /**
   * CSS that can reasonably be treated as describing THIS page. A linked sheet
   * counts: generated sites often ship 0 bytes of inline CSS and 180KB of
   * bundle. A sheet that ships every utility does not: presence implies nothing.
   */
  public get appliedCss(): string {
    if (this.appliedCache === null) {
      const combined = this.shipsEveryUtility
        ? this.authorCss
        : `${this.authorCss}\n${this.bundleCss}`;
      this.appliedCache = stripNonPainting(combined.slice(0, AnalysisLimits.maxCssBytes));
    }
    return this.appliedCache;
  }

  public get authorCssLower(): string {
    if (this.lowerCache === null) this.lowerCache = this.authorCss.toLowerCase();
    return this.lowerCache;
  }

  /** Author CSS plus every linked sheet, unstripped: keyframes and tokens survive. */
  public get allCss(): string {
    if (this.allCache === null) this.allCache = `${this.authorCss}\n${this.bundleCss}`;
    return this.allCache;
  }

  public get authorPaintingCss(): string {
    if (this.authorPaintingCache === null) {
      this.authorPaintingCache = stripNonPainting(this.authorCss);
    }
    return this.authorPaintingCache;
  }

  /**
   * How many blocks of the page's OWN CSS carry all of these. Deliberately not
   * `appliedCss`: a compiled bundle ships components the page never renders, and
   * counting those credited three sites with rows and labels they do not have.
   */
  public authorBlockCount(...patterns: readonly RegExp[]): number {
    let count = 0;
    for (const body of blockBodies(this.authorPaintingCss)) {
      if (patterns.every((pattern) => pattern.test(body))) count += 1;
    }
    return count;
  }

  /** Do both patterns appear in the SAME declaration block? */
  public blockHas(first: RegExp, second: RegExp): boolean {
    for (const body of blockBodies(this.appliedCss)) {
      if (first.test(body) && second.test(body)) return true;
    }
    return false;
  }

  /**
   * Occurrence thresholds have to scale with how much CSS a site ships: one
   * positioned radial gradient in 8KB of hand-written CSS is a decision, one in
   * 400KB of design system is a rounding error.
   */
  public get scale(): number {
    return Math.max(1, this.appliedCss.length / 120_000);
  }
}
