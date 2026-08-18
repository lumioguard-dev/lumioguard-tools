import { RuleCategory } from '../../domain/RuleCategory.js';
import { type Rule, defineRule } from '../Rule.js';
import { countMatches, evidence } from '../support.js';

export const layoutRules: readonly Rule[] = [
  defineRule({
    id: 'layout.bento',
    category: RuleCategory.Layout,
    weight: 9,
    label: 'A bento grid',
    phrase: 'a bento grid',
    evaluate: (ctx) =>
      evidence(
        ctx.usesClass(/\bbento\b/i) || /\bbento\b/i.test(ctx.content.text),
        'the boxes-of-different-sizes layout',
      ),
  }),

  defineRule({
    id: 'layout.gradient-blob',
    category: RuleCategory.Layout,
    weight: 9,
    label: 'A blurry coloured glow behind the page',
    phrase: 'a blurred glow behind the page',
    evaluate: (ctx) => {
      if (
        ctx.usesClass(/\bblur-(?:2xl|3xl)\b/) &&
        ctx.usesClass(/\bbg-gradient|from-[a-z]+-\d{2,3}\b/)
      ) {
        return 'a heavily blurred gradient sits behind the content';
      }
      const author = ctx.styles.authorPaintingCss;
      if (/(?<![\w-])filter\s*:\s*blur\(\s*\d{2,}px/i.test(author) && /gradient/i.test(author)) {
        return 'a heavily blurred gradient sits behind the content';
      }
      if (
        ctx.usesClass(/\b(?:aurora|gradient-blob|blob-bg|glow-bg|ambient-glow|mesh-gradient)\b/)
      ) {
        return 'an aurora-style glow behind the content';
      }
      return evidence(
        /\.(?:aurora|blob|mesh-gradient)\b[^{]*\{[^}]*(?:gradient|blur)/i.test(author),
        'an aurora-style glow behind the content',
      );
    },
  }),

  defineRule({
    id: 'layout.ai-palette',
    category: RuleCategory.Layout,
    weight: 8,
    label: 'The indigo-to-violet gradient every AI tool ships',
    phrase: 'the indigo-into-violet house gradient',
    evaluate: (ctx) => {
      const stops = countMatches(
        ctx.document.classText,
        /\b(?:from|via|to)-(?:indigo|violet|purple|fuchsia)-\d{2,3}\b/g,
      );
      if (stops >= 2) return `${stops} indigo/violet gradient stops`;
      return evidence(
        countMatches(
          ctx.styles.authorCss,
          /#(?:6366f1|8b5cf6|a855f7|7c3aed|818cf8|c026d3|d946ef)\b/gi,
        ) >= 2,
        'stock indigo/violet hexes',
      );
    },
  }),

  defineRule({
    id: 'layout.trusted-by',
    category: RuleCategory.Layout,
    weight: 7,
    label: 'A trusted-by logo row',
    phrase: 'a trusted-by row of logos',
    evaluate: (ctx) =>
      evidence(
        /\btrusted by\b|\bloved by\b|\bpowering teams at\b/i.test(ctx.content.text),
        'a row of company logos under a trust line',
      ),
  }),

  defineRule({
    id: 'layout.three-card-grid',
    category: RuleCategory.Layout,
    weight: 6,
    label: 'Three feature cards side by side',
    phrase: 'three feature cards in a row',
    evaluate: (ctx) =>
      evidence(
        ctx.usesClass(/\b(?:md:|lg:|sm:)?grid-cols-3\b/),
        'the standard three-across card row',
      ),
  }),

  defineRule({
    id: 'layout.dark-neon',
    category: RuleCategory.Layout,
    weight: 5,
    label: 'Dark background with neon accents',
    evaluate: (ctx) => {
      const author = ctx.styles.authorCss;
      const darkBackground =
        /background(?:-color)?\s*:\s*(?:#0[0-9a-f]{5}\b|#0{3,6}\b|rgb\(\s*\d{1,2}\s*,\s*\d{1,2}\s*,\s*\d{1,2})/i.test(
          author,
        ) || ctx.usesClass(/\bbg-(?:black|zinc-9\d{2}|neutral-9\d{2}|slate-9\d{2})\b/);
      const neon =
        /#(?:00ff[0-9a-f]{2}|39ff14|00e5ff|ff00e5|b026ff|7df9ff)\b/i.test(author) ||
        ctx.usesClass(/\btext-(?:cyan|lime|fuchsia)-(?:3|4)\d{2}\b/);
      return evidence(darkBackground && neon, 'near-black background under a neon highlight');
    },
  }),
];
