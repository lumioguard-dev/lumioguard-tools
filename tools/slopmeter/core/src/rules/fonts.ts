import type { PageContext } from '../analysis/PageContext.js';

/**
 * The faces so many sites reach for that picking one says nothing. Shared so
 * the penalty and the craft credit cannot disagree about the same typeface.
 */
export const OVERUSED_FONTS = [
  'inter',
  'roboto',
  'open sans',
  'lato',
  'montserrat',
  'fraunces',
  'geist',
  'mona sans',
  'plus jakarta sans',
  'space grotesk',
  'recoleta',
  'instrument sans',
  'instrument serif',
] as const;

/** A typeface is not a monoculture tell on the site that commissioned it. */
export const BRAND_FONT_HOSTS: Readonly<Record<string, readonly string[]>> = {
  roboto: ['google.com', 'youtube.com', 'android.com', 'web.dev'],
  geist: ['vercel.com', 'nextjs.org', 'v0.app', 'v0.dev'],
  'mona sans': ['github.com'],
  inter: ['rsms.me'],
};

/**
 * The overused face this page declares first, or null. Takes the context so the
 * penalty and the credit read the same inputs: extracting the families twice and
 * passing different asset strings let a page take the charge and lose the credit.
 */
export function overusedFontHere(ctx: PageContext): string | null {
  const primaries = [...ctx.styles.authorCssLower.matchAll(/font-family\s*:\s*([^;}]+)/g)].map(
    (match) => ((match[1] ?? '').split(',')[0] ?? '').replace(/["']/g, '').trim(),
  );
  return overusedFontOf(primaries, ctx.document.assetRefs, ctx.host);
}

function overusedFontOf(
  declared: readonly string[],
  assetRefs: string,
  host: string,
): string | null {
  for (const font of OVERUSED_FONTS) {
    const uses =
      declared.includes(font) ||
      new RegExp(`family=${font.replace(/ /g, '\\+')}`, 'i').test(assetRefs);
    if (!uses) continue;
    const exempt = (BRAND_FONT_HOSTS[font] ?? []).some(
      (brand) => host === brand || host.endsWith(`.${brand}`),
    );
    if (!exempt) return font;
  }
  return null;
}
