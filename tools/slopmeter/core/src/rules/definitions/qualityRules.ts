import { RuleCategory } from '../../domain/RuleCategory.js';
import { type Rule, defineRule } from '../Rule.js';
import { evidence } from '../support.js';

const GENERIC_TITLES = [
  '',
  'home',
  'index',
  'untitled',
  'document',
  'create next app',
  'react app',
  'vite app',
  'my app',
  'welcome',
  'new project',
] as const;

export const qualityRules: readonly Rule[] = [
  defineRule({
    id: 'quality.no-social-card',
    category: RuleCategory.Quality,
    weight: 6,
    label: 'No description for search or sharing',
    phrase: 'no description for search or sharing',
    evaluate: (ctx) => {
      const { meta } = ctx.document;
      return evidence(
        !meta.description && !meta['og:description'] && !meta['og:title'],
        'nothing useful appears when the link is shared',
      );
    },
  }),

  defineRule({
    id: 'quality.unlabelled-images',
    category: RuleCategory.Quality,
    weight: 6,
    label: 'Images with no alt text',
    phrase: 'images with nothing said about them',
    evaluate: (ctx) => {
      const { images } = ctx.document;
      if (images.length < 4) return null;
      const missing = images.filter((image) => image.alt === null).length;
      return evidence(missing / images.length > 0.5, `${missing}/${images.length} missing alt`);
    },
  }),

  defineRule({
    id: 'quality.no-icon',
    category: RuleCategory.Quality,
    weight: 5,
    label: 'No favicon of its own',
    evaluate: (ctx) =>
      evidence(!ctx.document.hasIcon, 'the browser tab falls back to a blank page icon'),
  }),

  defineRule({
    id: 'quality.placeholder-title',
    category: RuleCategory.Quality,
    weight: 5,
    label: 'A placeholder page title',
    evaluate: (ctx) => {
      const title = ctx.document.title.toLowerCase().trim();
      return evidence(
        (GENERIC_TITLES as readonly string[]).includes(title),
        `"${ctx.document.title === '' ? '(empty)' : ctx.document.title}"`,
      );
    },
  }),

  defineRule({
    id: 'quality.no-language',
    category: RuleCategory.Quality,
    weight: 4,
    label: 'Page language never declared',
    evaluate: (ctx) =>
      evidence(!ctx.document.lang, 'screen readers cannot tell what language to speak'),
  }),

  defineRule({
    id: 'quality.heading-gap',
    category: RuleCategory.Quality,
    weight: 4,
    label: 'Heading levels skip a step',
    evaluate: (ctx) => {
      const levels = ctx.document.headings.map((h) => h.level);
      for (let i = 1; i < levels.length; i++) {
        const previous = levels[i - 1] ?? 0;
        const current = levels[i] ?? 0;
        if (current - previous > 1) return `h${previous} → h${current}`;
      }
      return null;
    },
  }),

  defineRule({
    id: 'quality.debug-logging',
    category: RuleCategory.Quality,
    weight: 4,
    label: 'Debug logging left switched on',
    evaluate: (ctx) => {
      const inline = (
        ctx.html.match(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi) ?? []
      ).join('\n');
      return evidence(
        /console\.(?:log|debug)\s*\(/.test(inline),
        'console output still runs for every visitor',
      );
    },
  }),

  defineRule({
    id: 'quality.heavy-dom',
    category: RuleCategory.Quality,
    weight: 6,
    label: 'An unusually complex page',
    phrase: 'thousands of elements saying very little',
    evaluate: (ctx) =>
      evidence(ctx.document.elementCount > 1500, `${ctx.document.elementCount} elements`),
  }),

  defineRule({
    id: 'quality.inline-styles',
    category: RuleCategory.Quality,
    weight: 4,
    label: 'Styles written inline all over the markup',
    evaluate: (ctx) =>
      evidence(
        ctx.document.inlineStyleCount >= 40,
        `${ctx.document.inlineStyleCount} inline style attributes`,
      ),
  }),

  defineRule({
    id: 'quality.repeated-headings',
    category: RuleCategory.Quality,
    weight: 4,
    label: 'The same heading repeated over and over',
    evaluate: (ctx) => {
      const counts = new Map<string, number>();
      for (const heading of ctx.document.headings) {
        const key = heading.text.toLowerCase();
        if (key.length < 6) continue;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const repeated = [...counts.values()].filter((n) => n >= 3).length;
      return evidence(repeated >= 2, `${repeated} headings repeated 3+ times`);
    },
  }),
];
