import { RuleCategory } from '../../domain/RuleCategory.js';
import { type Rule, defineRule } from '../Rule.js';
import { evidence } from '../support.js';

/**
 * Negative weights: evidence of deliberate work, which is what protects a
 * well-built site from its own stock choices.
 *
 * The total is deliberately capped near -16. `Score` already caps credits at
 * half the penalty total, which protects clean pages where penalties are small.
 * Letting this pile grow only ends up excusing genuinely templated sites,
 * because big slop sites are also the ones with real footers, GitHub links and
 * long copy.
 */
export const humanRules: readonly Rule[] = [
  defineRule({
    id: 'human.real-pages',
    category: RuleCategory.Human,
    weight: -4,
    label: 'Real pages behind the front door',
    evaluate: (ctx) => {
      const count = ctx.document.internalPaths.size;
      return evidence(count >= 2, `${count} internal pages`);
    },
  }),

  defineRule({
    id: 'human.github',
    category: RuleCategory.Human,
    weight: -3,
    label: 'Links to its own source',
    evaluate: (ctx) =>
      evidence(/github\.com\/[a-z0-9_.-]+/i.test(ctx.html), 'the people who made it are findable'),
  }),

  defineRule({
    id: 'human.deep-content',
    category: RuleCategory.Human,
    weight: -3,
    label: 'Someone actually wrote this',
    evaluate: (ctx) =>
      evidence(
        ctx.content.text.length > 6000,
        `${Math.round(ctx.content.text.length / 1000)}k chars of copy`,
      ),
  }),

  defineRule({
    id: 'human.rich-meta',
    category: RuleCategory.Human,
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
    id: 'human.custom-fonts',
    category: RuleCategory.Human,
    weight: -2,
    label: 'Type chosen, not inherited',
    evaluate: (ctx) =>
      evidence(
        /@font-face/i.test(ctx.styles.allCss) || /\.woff2?\b/i.test(ctx.document.assetRefs),
        'a typeface was loaded on purpose',
      ),
  }),

  defineRule({
    id: 'human.custom-favicon',
    category: RuleCategory.Human,
    weight: -2,
    label: 'A favicon of its own',
    evaluate: (ctx) => evidence(ctx.document.hasIcon, 'someone drew an icon for the tab'),
  }),
];
