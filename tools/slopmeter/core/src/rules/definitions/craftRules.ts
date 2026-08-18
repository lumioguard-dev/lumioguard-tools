import { RuleCategory } from '../../domain/RuleCategory.js';
import { type Rule, defineRule } from '../Rule.js';
import { countMatches, evidence, plural } from '../support.js';

const OVERUSED_FONTS = [
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
const BRAND_FONT_HOSTS: Readonly<Record<string, readonly string[]>> = {
  roboto: ['google.com', 'youtube.com', 'android.com', 'web.dev'],
  geist: ['vercel.com', 'nextjs.org', 'v0.app', 'v0.dev'],
  'mona sans': ['github.com'],
  inter: ['rsms.me'],
};

const DISPLAY_SERIFS = [
  'fraunces',
  'recoleta',
  'newsreader',
  'playfair',
  'cormorant',
  'instrument serif',
  'dm serif',
] as const;

export const craftRules: readonly Rule[] = [
  defineRule({
    id: 'craft.side-tab',
    category: RuleCategory.Craft,
    weight: 8,
    label: 'A thick coloured stripe down one edge',
    phrase: 'a thick coloured stripe down one edge',
    evaluate: (ctx) => {
      const count = countMatches(ctx.document.classText, /\bborder-[lrse]-(?:[4-8])\b/g);
      if (count >= 2) return `${count} thick side borders`;
      const match = ctx.styles.authorCss.match(
        /border-(?:left|right|inline-start|inline-end)\s*:\s*(?:[3-9]|\d{2})px\s+solid\s+(?!(?:#(?:f{3}|f{6}|0{3}|0{6}|e{3}|e{6})\b|transparent|currentcolor))/i,
      );
      return match === null ? null : match[0].slice(0, 44);
    },
  }),

  defineRule({
    id: 'craft.gradient-text',
    category: RuleCategory.Craft,
    weight: 8,
    label: 'Text filled with a gradient',
    phrase: 'gradient-filled text',
    evaluate: (ctx) => {
      if (
        ctx.usesClass(/\bbg-clip-text\b/) &&
        ctx.usesClass(/\bbg-gradient-to-|\bfrom-[a-z]+-\d{2,3}\b/)
      ) {
        return 'a heading is painted with a gradient instead of a colour';
      }
      const author = ctx.styles.authorPaintingCss;
      return evidence(
        /(?<![\w-])background-clip\s*:\s*text|-webkit-background-clip\s*:\s*text/i.test(author) &&
          /gradient/i.test(author),
        'a heading is painted with a gradient instead of a colour',
      );
    },
  }),

  defineRule({
    id: 'craft.overused-font',
    category: RuleCategory.Craft,
    weight: 6,
    label: 'One of the handful of fonts everything uses',
    phrase: 'the typeface everything else is set in',
    evaluate: (ctx) => {
      // Only the PRIMARY family of an author-declared stack counts.
      const primaries = [...ctx.styles.authorCssLower.matchAll(/font-family\s*:\s*([^;}]+)/g)].map(
        (m) => ((m[1] ?? '').split(',')[0] ?? '').replace(/["']/g, '').trim(),
      );
      const googleFonts = (
        ctx.document.assetRefs.match(/fonts\.googleapis\.com\/css2?\?[^"'\s)>]*/g) ?? []
      ).join(' ');

      for (const font of OVERUSED_FONTS) {
        const declared =
          primaries.includes(font) ||
          new RegExp(`family=${font.replace(/ /g, '\\+')}`, 'i').test(googleFonts);
        if (!declared) continue;
        const exempt = (BRAND_FONT_HOSTS[font] ?? []).some(
          (host) => ctx.host === host || ctx.host.endsWith(`.${host}`),
        );
        if (!exempt) return font;
      }
      return null;
    },
  }),

  defineRule({
    id: 'craft.icon-tile-stack',
    category: RuleCategory.Craft,
    weight: 6,
    label: 'Rounded icon tiles stacked above headings',
    phrase: 'rounded icon tiles above every heading',
    evaluate: (ctx) => {
      const count = countMatches(
        ctx.html,
        /class="[^"]*\b(?:w|h)-(?:10|12|14|16)\b[^"]*\brounded-(?:lg|xl|2xl)\b[^"]*"[^>]*>\s*<svg/gi,
      );
      return evidence(count >= 3, plural(count, 'icon tile'));
    },
  }),

  defineRule({
    id: 'craft.kicker-eyebrow',
    category: RuleCategory.Craft,
    weight: 5,
    label: 'Tiny all-caps labels above headings',
    phrase: 'tiny all-caps labels above the headings',
    evaluate: (ctx) => {
      const count = countMatches(
        ctx.html,
        /class="[^"]*\btext-xs\b[^"]*\buppercase\b[^"]*\btracking-(?:wide|wider|widest)\b[^"]*"/gi,
      );
      return evidence(count >= 3, plural(count, 'tiny all-caps label'));
    },
  }),

  defineRule({
    id: 'craft.bounce-easing',
    category: RuleCategory.Craft,
    weight: 4,
    label: 'Bouncing animation',
    evaluate: (ctx) => {
      if (ctx.usesClass(/\banimate-bounce\b/)) return 'animate-bounce';
      return evidence(
        /animation(?:-name)?\s*:[^;}]*(?:bounce|elastic|wobble)/i.test(ctx.styles.authorCss),
        'bounce keyframes',
      );
    },
  }),

  defineRule({
    id: 'craft.marquee',
    category: RuleCategory.Craft,
    weight: 4,
    label: 'An auto-scrolling marquee',
    evaluate: (ctx) =>
      evidence(
        /<marquee\b/i.test(ctx.html) || ctx.usesClass(/\banimate-marquee\b|\bmarquee\b/),
        'marquee',
      ),
  }),

  defineRule({
    id: 'craft.pulsing-dot',
    category: RuleCategory.Craft,
    weight: 4,
    label: 'A pulsing dot that reports nothing',
    evaluate: (ctx) => {
      const count = countMatches(
        ctx.html,
        /class="[^"]*\banimate-pulse\b[^"]*\brounded-full\b[^"]*"|class="[^"]*\brounded-full\b[^"]*\banimate-pulse\b[^"]*"/gi,
      );
      return evidence(count >= 1, plural(count, 'pulsing dot'));
    },
  }),

  defineRule({
    id: 'craft.dark-glow',
    category: RuleCategory.Craft,
    weight: 5,
    label: 'Coloured glows instead of shadows',
    phrase: 'coloured glow where a shadow belongs',
    evaluate: (ctx) => {
      const count = countMatches(
        ctx.styles.authorPaintingCss,
        /(?<![\w-])box-shadow\s*:\s*0\s+0\s+\d{2,}px\s+(?:\d+px\s+)?(?:rgba?\(|#(?!0{3,6}\b|f{3,6}\b))/gi,
      );
      return evidence(count >= 2, plural(count, 'coloured glow'));
    },
  }),

  defineRule({
    id: 'craft.radial-halo',
    category: RuleCategory.Craft,
    weight: 5,
    label: 'Decorative glowing halos',
    evaluate: (ctx) => {
      const count =
        countMatches(
          ctx.styles.authorPaintingCss,
          /radial-gradient\([^)]*(?:transparent|rgba?\([^)]*,\s*0(?:\.\d+)?\s*\))/gi,
        ) + countMatches(ctx.document.classText, /\bbg-\[radial-gradient/g);
      return evidence(count >= 2, plural(count, 'glowing halo'));
    },
  }),

  defineRule({
    id: 'craft.grid-background',
    category: RuleCategory.Craft,
    weight: 4,
    label: 'Graph-paper grid behind the content',
    evaluate: (ctx) =>
      evidence(
        /linear-gradient\([^)]*\)\s*,\s*linear-gradient\([^)]*\)[\s\S]{0,120}background-size\s*:\s*\d{1,3}px\s+\d{1,3}px/i.test(
          ctx.styles.authorCss,
        ),
        'a repeating grid is tiled behind the content',
      ),
  }),

  defineRule({
    id: 'craft.tight-leading',
    category: RuleCategory.Craft,
    weight: 4,
    label: 'Body text set too tight to read comfortably',
    evaluate: (ctx) => {
      const match = ctx.styles.authorPaintingCss.match(
        /(?:^|[;{])\s*(?:body|p|\.prose)?[^{};]*(?<![\w-])line-height\s*:\s*(1(?:\.[0-2]\d?)?)\s*[;}]/,
      );
      if (match === null) return null;
      return evidence(Number.parseFloat(match[1] ?? '2') < 1.3, `line-height ${match[1]}`);
    },
  }),

  defineRule({
    id: 'craft.tiny-text',
    category: RuleCategory.Craft,
    weight: 4,
    label: 'Text too small to read comfortably',
    evaluate: (ctx) => {
      const sizes = [
        ...ctx.styles.authorPaintingCss.matchAll(
          /(?<![\w-])font-size\s*:\s*(\d{1,2}(?:\.\d+)?)px/g,
        ),
      ].map((m) => Number.parseFloat(m[1] ?? '0'));
      // Under 4px is a layout hack (`font-size:0.001px` kills inline-block gaps),
      // not text anyone is meant to read.
      const tiny = sizes.filter((size) => size >= 4 && size < 12);
      // Share, not count: every mature system has caption and legal styles under
      // 12px. Two among forty sizes is a scale; two among six is a decision.
      if (tiny.length >= 2 && tiny.length / sizes.length >= 0.2) {
        return `${tiny.length} of ${sizes.length} font-size declarations under 12px`;
      }
      return evidence(ctx.usesClass(/\btext-\[(?:[0-9]|10|11)px\]/), 'text set below 12px');
    },
  }),

  defineRule({
    id: 'craft.justified-text',
    category: RuleCategory.Craft,
    weight: 3,
    label: 'Justified text without hyphenation',
    evaluate: (ctx) =>
      evidence(
        /text-align\s*:\s*justify/i.test(ctx.styles.authorCss) &&
          !/hyphens\s*:\s*auto/i.test(ctx.styles.authorCss),
        'justified edges leave rivers of white space',
      ),
  }),

  defineRule({
    id: 'craft.layout-transition',
    category: RuleCategory.Craft,
    weight: 3,
    label: 'Animating width and height, which stutters',
    evaluate: (ctx) =>
      evidence(
        /(?<![\w-])transition(?:-property)?\s*:\s*(?![^;}]*\ball\b)[^;}]*\b(?:width|height|padding|margin)\b/i.test(
          ctx.styles.authorPaintingCss,
        ),
        'transition on width/height/padding',
      ),
  }),

  defineRule({
    id: 'craft.italic-serif-display',
    category: RuleCategory.Craft,
    weight: 5,
    label: 'The italic serif headline of the moment',
    evaluate: (ctx) => {
      const stacks = `${ctx.styles.authorCssLower} ${ctx.document.assetRefs}`;
      const hasSerif = DISPLAY_SERIFS.some(
        (font) => stacks.includes(font) || stacks.includes(font.replace(/ /g, '+')),
      );
      const italicHeading =
        /<h[12][^>]*class="[^"]*\bitalic\b/i.test(ctx.html) ||
        /h[12][^{]*\{[^}]*font-style\s*:\s*italic/i.test(ctx.styles.authorCss);
      return evidence(hasSerif && italicHeading, 'italic serif display face');
    },
  }),

  defineRule({
    id: 'craft.aphoristic-cadence',
    category: RuleCategory.Craft,
    weight: 5,
    label: 'Copy written in clipped slogans',
    evaluate: (ctx) => {
      const count =
        countMatches(ctx.content.text, /\bNot an? [a-z][^.!?]{1,40}[.!]\s+[A-Z][^.!?]{1,60}[.!]/g) +
        countMatches(
          ctx.content.text,
          /\b[A-Z][^.!?]{4,80}[.!]\s+(?:No|Just)\s+[a-z][^.!?]{2,60}[.!]/g,
        );
      return evidence(count >= 3, plural(count, 'clipped slogan'));
    },
  }),

  defineRule({
    id: 'craft.nested-cards',
    category: RuleCategory.Craft,
    weight: 4,
    label: 'Cards inside cards',
    evaluate: (ctx) => {
      const count = countMatches(
        ctx.html,
        /class="[^"]*\brounded-(?:lg|xl|2xl)\b[^"]*\bborder\b[^"]*"[^>]*>[\s\S]{0,300}?class="[^"]*\brounded-(?:lg|xl|2xl)\b[^"]*\bborder\b[^"]*"/gi,
      );
      return evidence(
        count >= 4,
        plural(count, 'card inside another card', 'cards inside other cards'),
      );
    },
  }),
];
