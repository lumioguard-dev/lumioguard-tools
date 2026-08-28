import { RuleCategory } from '../../domain/RuleCategory.js';
import { type Rule, defineRule } from '../Rule.js';
import { overusedFontHere } from '../fonts.js';
import { evidence } from '../support.js';

/**
 * Negative weights: evidence of deliberate work. The pile is capped near -16 on
 * purpose, because big templated sites also have real footers, GitHub links and
 * long copy, so letting it grow ends up excusing them. `Score` caps it again.
 */
export const handworkRules: readonly Rule[] = [
  defineRule({
    id: 'handwork.pages-behind',
    category: RuleCategory.Handwork,
    weight: -4,
    label: 'Real pages behind the front door',
    evaluate: (ctx) => {
      const count = ctx.document.internalPaths.size;
      return evidence(count >= 2, `${count} internal pages`);
    },
  }),

  defineRule({
    id: 'handwork.findable-source',
    category: RuleCategory.Handwork,
    weight: -3,
    label: 'Links to its own source',
    evaluate: (ctx) =>
      evidence(/github\.com\/[a-z0-9_.-]+/i.test(ctx.html), 'the people who made it are findable'),
  }),

  defineRule({
    id: 'handwork.written-copy',
    category: RuleCategory.Handwork,
    weight: -3,
    label: 'Someone actually wrote this',
    evaluate: (ctx) =>
      evidence(
        ctx.content.text.length > 6000,
        `${Math.round(ctx.content.text.length / 1000)}k chars of copy`,
      ),
  }),

  defineRule({
    id: 'handwork.considered-meta',
    category: RuleCategory.Handwork,
    weight: -2,
    label: 'Metadata that was thought about',
    evaluate: (ctx) => {
      const { meta } = ctx.document;
      return evidence(
        Boolean(meta.description) && Boolean(meta['og:title'] ?? meta['og:image']),
        'a real description and social preview',
      );
    },
  }),

  defineRule({
    id: 'handwork.chosen-type',
    category: RuleCategory.Handwork,
    weight: -2,
    label: 'Type chosen, not inherited',
    evaluate: (ctx) => {
      const loaded =
        /@font-face/i.test(ctx.styles.allCss) || /\.woff2?\b/i.test(ctx.document.assetRefs);
      if (!loaded) return null;
      // Reaching for the face everyone reaches for is not choosing one, and
      // crediting it here contradicted the penalty the same page just took.
      return evidence(overusedFontHere(ctx) === null, 'a typeface was loaded on purpose');
    },
  }),

  defineRule({
    id: 'handwork.drawn-icon',
    category: RuleCategory.Handwork,
    weight: -2,
    label: 'A favicon of its own',
    evaluate: (ctx) => evidence(ctx.document.hasIcon, 'someone drew an icon for the tab'),
  }),
];
