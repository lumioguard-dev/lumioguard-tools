import { RuleCategory } from '../../domain/RuleCategory.js';
import { type Rule, defineRule } from '../Rule.js';
import { overusedFontHere } from '../fonts.js';
import { countMatches, evidence, plural } from '../support.js';

const DISPLAY_SERIFS = [
  'fraunces',
  'recoleta',
  'newsreader',
  'playfair',
  'cormorant',
  'instrument serif',
  'dm serif',
] as const;

export const finishRules: readonly Rule[] = [
  defineRule({
    id: 'finish.side-stripe',
    category: RuleCategory.Finish,
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
    id: 'finish.gradient-text',
    category: RuleCategory.Finish,
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
    id: 'finish.crowd-typeface',
    category: RuleCategory.Finish,
    weight: 6,
    label: 'One of the handful of fonts everything uses',
    phrase: 'the typeface everything else is set in',
    evaluate: (ctx) => overusedFontHere(ctx),
  }),

  defineRule({
    id: 'finish.icon-tiles',
    category: RuleCategory.Finish,
    weight: 6,
    label: 'Rounded icon tiles stacked above headings',
    phrase: 'rounded icon tiles above every heading',
    evaluate: (ctx) => {
      const count = countMatches(
        ctx.html,
        /class="[^"]*\b(?:w|h)-(?:10|12|14|16)\b[^"]*\brounded-(?:lg|xl|2xl)\b[^"]*"[^>]*>\s*<svg/gi,
      );
      if (count >= 3) return plural(count, 'icon tile');

      // The same tile without the utility classes, asked of the tree rather
      // than of the markup: a rounded box whose own child is the icon.
      const tiled = ctx.document.root.querySelectorAll(
        '[style*="border-radius"] > svg, [class*="rounded"] > svg',
      ).length;
      return evidence(tiled >= 3, plural(tiled, 'icon tile'));
    },
  }),

  defineRule({
    id: 'finish.shouted-label',
    category: RuleCategory.Finish,
    weight: 5,
    label: 'Tiny all-caps labels above headings',
    phrase: 'tiny all-caps labels above the headings',
    evaluate: (ctx) => {
      const count = countMatches(
        ctx.html,
        /class="[^"]*\btext-xs\b[^"]*\buppercase\b[^"]*\btracking-(?:wide|wider|widest)\b[^"]*"/gi,
      );
      if (count >= 3) return plural(count, 'tiny all-caps label');

      // The same label written as CSS: uppercased and tracked out, in one rule.
      const uppercase = /text-transform\s*:\s*uppercase/i;
      const tracked = /letter-spacing\s*:\s*(?:0?\.0*[5-9]\d*em|[1-9][\d.]*(?:px|em|rem))/i;
      const styled =
        ctx.styles.authorBlockCount(uppercase, tracked) +
        ctx.document.countStyleAttr(uppercase, tracked);
      if (styled >= 2) return plural(styled, 'tiny all-caps label');

      // Typed in capitals rather than transformed into them, which is what a visual
      // builder produces. Asked of the tree, so a shouted line must precede a heading:
      // counting capitals in the prose scored a technical site for writing MAUI and API.
      const shouted = ctx.document.elements.filter((element) => {
        if (element.children.length > 0) return false;
        const line = (element.textContent ?? '').trim();
        if (line.length < 4 || line.length > 48) return false;
        if (line !== line.toUpperCase() || !/[A-Z]{3}/.test(line)) return false;
        return /^H[1-3]$/.test(element.nextElementSibling?.tagName ?? '');
      }).length;
      return evidence(shouted >= 3, plural(shouted, 'tiny all-caps label'));
    },
  }),

  defineRule({
    id: 'finish.bounce-easing',
    category: RuleCategory.Finish,
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
    id: 'finish.marquee',
    category: RuleCategory.Finish,
    weight: 4,
    label: 'An auto-scrolling marquee',
    evaluate: (ctx) => {
      if (/<marquee\b/i.test(ctx.html) || ctx.usesClass(/\banimate-marquee\b|\bmarquee\b/)) {
        return 'marquee';
      }
      // A track translated its own width, forever: the hand-rolled marquee.
      const named = /@keyframes\s+[\w-]*(?:marquee|ticker|scroll(?:ing)?|slide)\b/i;
      const endless =
        /animation[^;}]*\binfinite\b[^;}]*\blinear\b|animation[^;}]*\blinear\b[^;}]*\binfinite\b/i;
      const shifts = /translate(?:3d|X)?\(\s*-?(?:100|50)%/i;
      const css = ctx.styles.allCss;
      return evidence(
        named.test(css) ||
          (shifts.test(css) &&
            (endless.test(ctx.styles.authorPaintingCss) || endless.test(ctx.document.styleText))),
        'marquee',
      );
    },
  }),

  defineRule({
    id: 'finish.pulsing-dot',
    category: RuleCategory.Finish,
    weight: 4,
    label: 'A pulsing dot that reports nothing',
    evaluate: (ctx) => {
      const count = countMatches(
        ctx.html,
        /class="[^"]*\banimate-pulse\b[^"]*\brounded-full\b[^"]*"|class="[^"]*\brounded-full\b[^"]*\banimate-pulse\b[^"]*"/gi,
      );
      if (count >= 1) return plural(count, 'pulsing dot');

      // Keyframes live outside the painting CSS, so read the sheets unfiltered.
      const pulses = /@keyframes\s+[\w-]*(?:pulse|ping|blink|breath)/i.test(ctx.styles.allCss);
      const round = /border-radius\s*:\s*(?:50%|100%|9{2,4}px)/i;
      return evidence(
        pulses && (round.test(ctx.styles.authorPaintingCss) || round.test(ctx.document.styleText)),
        'a dot pulsing beside a status that never changes',
      );
    },
  }),

  defineRule({
    id: 'finish.coloured-glow',
    category: RuleCategory.Finish,
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
    id: 'finish.halo',
    category: RuleCategory.Finish,
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
    id: 'finish.graph-paper',
    category: RuleCategory.Finish,
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
    id: 'finish.tight-leading',
    category: RuleCategory.Finish,
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
    id: 'finish.small-type',
    category: RuleCategory.Finish,
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
    id: 'finish.justified-text',
    category: RuleCategory.Finish,
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
    id: 'finish.layout-animation',
    category: RuleCategory.Finish,
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
    id: 'finish.italic-serif',
    category: RuleCategory.Finish,
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
    id: 'finish.clipped-slogans',
    category: RuleCategory.Finish,
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
    id: 'finish.nested-cards',
    category: RuleCategory.Finish,
    weight: 4,
    label: 'Cards inside cards',
    evaluate: (ctx) => {
      const count = countMatches(
        ctx.html,
        /class="[^"]*\brounded-(?:lg|xl|2xl)\b[^"]*\bborder\b[^"]*"[^>]*>[\s\S]{0,300}?class="[^"]*\brounded-(?:lg|xl|2xl)\b[^"]*\bborder\b[^"]*"/gi,
      );
      if (count >= 4) {
        return plural(count, 'card inside another card', 'cards inside other cards');
      }
      // One rounded, bordered surface opening inside another. A descendant
      // query says that; a regex over 300 characters of markup only guessed it.
      const nested = ctx.document.root.querySelectorAll(
        '[style*="border-radius"] [style*="border-radius"]',
      ).length;
      return evidence(
        nested >= 4,
        plural(nested, 'card inside another card', 'cards inside other cards'),
      );
    },
  }),
];
