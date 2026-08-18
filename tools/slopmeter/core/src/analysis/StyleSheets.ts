import { AnalysisLimits } from './Limits.js';

/**
 * An inline sheet that a framework generated, not the author.
 *
 * React Native Web ships a preallocated atomic sheet inline: twitter.com serves
 * 62.5KB and 1540 rules under this id against 6KB of class attributes actually
 * used. Read as authored CSS it credited X with gradient blobs and coloured
 * glows it never paints.
 */
const FRAMEWORK_SHEET = /react-native-stylesheet|\[stylesheet-group/i;

/** A CDN drop-in ships every utility class whether the page uses it or not. */
const CDN_UTILITY_FRAMEWORK =
  /cdn\.tailwindcss\.com|unpkg\.com\/tailwindcss|jsdelivr\.net\/npm\/tailwindcss|bootstrap[.@][\d.]*\/dist\/css/i;

/**
 * Removes what a stylesheet contains but does not paint: `@keyframes` bodies
 * (an animation step is not a component) and custom-property declarations (a
 * declared token may never be referenced, and `--x-box-shadow:` otherwise reads
 * as `box-shadow:`). `var(--x)` references survive — they have no colon.
 */
function stripNonPainting(css: string): string {
  return css
    .replace(/@(?:-\w+-)?keyframes\b[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/gi, ' ')
    .replace(/--[\w-]+\s*:[^;}]*/g, ' ');
}

export class StyleSheets {
  /** Inline `<style>` written for this page, framework sheets excluded. */
  public readonly authorCss: string;
  /** Linked stylesheets. */
  public readonly bundleCss: string;
  /** Whether the page ships a sheet containing every utility, used or not. */
  public readonly shipsEveryUtility: boolean;

  private appliedCache: string | null = null;
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
   * CSS that can reasonably be treated as describing THIS page.
   *
   * A linked sheet is usually a compiled, tree-shaken build, so it counts:
   * many generated sites ship 0 bytes of inline CSS and 180KB of bundle, and
   * excluding it made every CSS rule silently miss them. The exception is a
   * sheet that ships everything, where presence never implies use.
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
    return this.authorCss.toLowerCase();
  }

  /** Author CSS plus every linked sheet, unfiltered. Used by `@font-face` checks. */
  public get allCss(): string {
    return `${this.authorCss}\n${this.bundleCss}`;
  }

  public get authorPaintingCss(): string {
    if (this.authorPaintingCache === null) {
      this.authorPaintingCache = stripNonPainting(this.authorCss);
    }
    return this.authorPaintingCache;
  }

  /** Do both patterns appear in the SAME declaration block? */
  public blockHas(first: RegExp, second: RegExp): boolean {
    const blockPattern = /\{([^{}]*)\}/g;
    for (let match = blockPattern.exec(this.appliedCss); match !== null; ) {
      const body = match[1] ?? '';
      if (first.test(body) && second.test(body)) return true;
      match = blockPattern.exec(this.appliedCss);
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
