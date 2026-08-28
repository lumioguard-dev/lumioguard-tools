import { RuleCategory } from '../../domain/RuleCategory.js';
import { type Rule, defineRule } from '../Rule.js';
import { countMatches, evidence } from '../support.js';

/**
 * Stock defaults a visitor can SEE score; invisible build machinery does not, so
 * `AxisPolicy` routes the Radix, Vite and `_next` rules to provenance. Stock
 * shadcn tokens and an untouched lucide set are the default look, so they score.
 */
export const stockRules: readonly Rule[] = [
  defineRule({
    id: 'stock.utility-cdn',
    category: RuleCategory.Stock,
    weight: 14,
    label: 'Tailwind loaded from the play CDN',
    phrase: 'Tailwind straight off the play CDN',
    evaluate: (ctx) =>
      evidence(/cdn\.tailwindcss\.com/i.test(ctx.document.assetRefs), 'cdn.tailwindcss.com'),
  }),

  defineRule({
    id: 'stock.component-theme',
    category: RuleCategory.Stock,
    weight: 12,
    label: 'Stock shadcn/ui theme values',
    phrase: 'stock shadcn values',
    evaluate: (ctx) => {
      const css = ctx.styles.authorCss;
      let signatures = 0;
      if (/--background:\s*0\s+0%\s+100%/i.test(css)) signatures++;
      if (/--foreground:\s*222\.2\s/i.test(css)) signatures++;
      if (/--muted-foreground:\s*215\.4\s/i.test(css)) signatures++;
      if (/--radius:\s*0\.5rem/i.test(css)) signatures++;
      if (
        /inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium/i.test(
          ctx.html,
        )
      ) {
        signatures++;
      }
      return evidence(signatures >= 2, `${signatures} shadcn signatures`);
    },
  }),

  defineRule({
    id: 'stock.primitives',
    category: RuleCategory.Stock,
    weight: 10,
    label: 'Radix UI components',
    phrase: 'Radix left exactly as it arrives',
    evaluate: (ctx) =>
      evidence(
        /data-radix/i.test(ctx.html) || /\bradix-ui\b/i.test(ctx.document.assetRefs),
        'radix primitives',
      ),
  }),

  defineRule({
    id: 'stock.icon-set',
    category: RuleCategory.Stock,
    weight: 8,
    label: 'The default lucide icon set, untouched',
    phrase: 'untouched stock icons',
    evaluate: (ctx) => {
      if (
        ctx.usesClass(/\blucide(?:-[a-z-]+)?\b/) ||
        /lucide-react|lucide\.dev/i.test(ctx.document.assetRefs)
      ) {
        return 'every icon comes straight from the stock set';
      }
      // The set's own signature, for a page that strips the class name: a 24px
      // box, 2px round-capped strokes, no fill. Several of them, not one.
      const signature = countMatches(
        ctx.html,
        /<svg\b[^>]*\bviewBox\s*=\s*["']0 0 24 24["'][^>]*\bstroke-width\s*=\s*["']2["'][^>]*\bstroke-linecap\s*=\s*["']round["']/gi,
      );
      return evidence(signature >= 3, 'every icon comes straight from the stock set');
    },
  }),

  defineRule({
    id: 'stock.vite-scaffold',
    category: RuleCategory.Stock,
    weight: 8,
    label: 'A default Vite build',
    phrase: 'a Vite scaffold nobody changed',
    evaluate: (ctx) =>
      evidence(
        /\/assets\/index-[A-Za-z0-9_-]{8}\.(?:js|css)/i.test(ctx.document.assetRefs),
        'Vite asset signature',
      ),
  }),

  defineRule({
    id: 'stock.next-scaffold',
    category: RuleCategory.Stock,
    weight: 6,
    label: 'A stock Next.js scaffold',
    phrase: 'the Next.js scaffold as it shipped',
    evaluate: (ctx) =>
      evidence(/\/_next\/static\//i.test(ctx.document.assetRefs), 'default _next scaffold'),
  }),
];
