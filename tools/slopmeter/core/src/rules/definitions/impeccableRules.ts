// Ported from pbakaus/impeccable's antipattern registry, kept to the subset
// detectable without a headless browser. Held in one file so provenance stays
// obvious and the set can be diffed against upstream.

import { RuleCategory } from '../../domain/RuleCategory.js';
import { colorPairs, contrastRatio } from '../ContrastPairs.js';
import { type Rule, defineRule } from '../Rule.js';
import { countMatches, evidence, plural } from '../support.js';

export const impeccableRules: readonly Rule[] = [
  defineRule({
    id: 'impeccable.thin-border-wide-shadow',
    category: RuleCategory.Craft,
    weight: 7,
    label: 'A hairline border under a big soft shadow',
    phrase: 'a hairline border under a wide soft shadow',
    // Both halves must sit on ONE element. Testing the stylesheet twice matched
    // a 1px divider in twitter's nav against a dropdown glow 33,000 characters
    // away.
    evaluate: (ctx) => {
      const hairline = /(?<![\w-])border(?:-\w+)?\s*:\s*(?:0?\.5|1)px\s+solid/i;
      const wide = /(?<![\w-])box-shadow\s*:[^;]*\b(?:1[6-9]|[2-9]\d|\d{3})px\b[^;]*rgba?\(/i;
      if (ctx.styles.blockHas(hairline, wide)) {
        return 'the same element commits to neither a real edge nor a real lift';
      }
      return evidence(
        ctx.document.hasSameClassAttr(/\bborder\b(?!-\d)/, /\bshadow-(?:2xl|xl)\b/),
        'the same element commits to neither a real edge nor a real lift',
      );
    },
  }),

  defineRule({
    id: 'impeccable.hero-eyebrow-chip',
    category: RuleCategory.Craft,
    weight: 5,
    label: 'A little pill above a giant headline',
    evaluate: (ctx) => {
      const pill = ctx.document.hasSameClassAttr(
        /\brounded-full\b/,
        /\btext-(?:xs|sm)\b/,
        /\b(?:border|bg-\w+-\d{2,3}\/\d{1,2}|backdrop-blur)\b/,
      );
      if (!pill) return null;
      // Only a hero eyebrow when there is a hero for it to sit above.
      return evidence(
        ctx.usesClass(/\btext-(?:5|6|7|8)xl\b/),
        'the rounded label-above-headline opening',
      );
    },
  }),

  defineRule({
    id: 'impeccable.radial-spotlight',
    category: RuleCategory.Craft,
    weight: 5,
    label: 'Spotlight glows used as decoration',
    evaluate: (ctx) => {
      const count = countMatches(
        ctx.styles.appliedCss,
        /radial-gradient\([^)]*(?:circle|ellipse)[^)]*at\s+(?:center|top|\d{1,3}%)/gi,
      );
      if (ctx.atLeast(count, 1)) {
        return plural(count, 'spotlight glow');
      }
      return evidence(ctx.usesClass(/\bbg-\[radial-gradient\(/), 'radial-gradient utility');
    },
  }),

  defineRule({
    id: 'impeccable.repeating-stripes',
    category: RuleCategory.Craft,
    weight: 4,
    label: 'Striped backgrounds',
    evaluate: (ctx) => {
      const count = countMatches(
        ctx.styles.appliedCss,
        /repeating-(?:linear|conic)-gradient\s*\(/gi,
      );
      return evidence(ctx.atLeast(count, 1), plural(count, 'striped surface'));
    },
  }),

  defineRule({
    id: 'impeccable.codex-grid-background',
    category: RuleCategory.Craft,
    weight: 4,
    label: 'Graph-paper grid behind the content',
    evaluate: (ctx) => {
      if (
        /(?<![\w-])background-image\s*:[^;]*linear-gradient[^;]*linear-gradient[\s\S]{0,140}(?<![\w-])background-size\s*:\s*\d{1,3}px/i.test(
          ctx.styles.appliedCss,
        )
      ) {
        return 'a grid is tiled behind the content as decoration';
      }
      return evidence(
        ctx.usesClass(/\bbg-\[linear-gradient\([^\]]*\)\][^"]*\bbg-\[size:/),
        'a grid is tiled behind the content as decoration',
      );
    },
  }),

  defineRule({
    id: 'impeccable.border-accent-on-rounded',
    category: RuleCategory.Craft,
    weight: 4,
    label: 'A thick border fighting a big corner radius',
    evaluate: (ctx) => {
      const thick = /(?<![\w-])border\s*:\s*(?:[3-9]|\d{2})px\s+solid/i;
      const round = /(?<![\w-])border-radius\s*:\s*(?:1[2-9]|[2-9]\d)px/i;
      if (ctx.styles.blockHas(thick, round)) return 'a heavy outline wrapped around soft corners';
      return evidence(
        ctx.document.hasSameClassAttr(/\bborder-[48]\b/, /\brounded-(?:xl|2xl|3xl|full)\b/),
        'a heavy outline wrapped around soft corners',
      );
    },
  }),

  defineRule({
    id: 'impeccable.oversized-h1',
    category: RuleCategory.Craft,
    weight: 4,
    label: 'A whole sentence set at poster size',
    evaluate: (ctx) => {
      const h1 = ctx.document.headings.find((h) => h.level === 1);
      if (h1 === undefined) return null;
      // A short wordmark at 7xl is a choice; a full sentence at display size is not.
      const words = h1.text.split(/\s+/).filter(Boolean).length;
      if (words < 8) return null;
      if (ctx.usesClass(/\btext-(?:6|7|8|9)xl\b/))
        return `a ${words}-word headline at display size`;
      const match = ctx.styles.appliedCss.match(
        /h1[^{]*\{[^}]*(?<![\w-])font-size\s*:\s*(\d(?:\.\d+)?)rem/i,
      );
      if (match === null) return null;
      return evidence(Number(match[1]) >= 4, `a ${words}-word headline at ${match[1]}rem`);
    },
  }),

  defineRule({
    id: 'impeccable.extreme-negative-tracking',
    category: RuleCategory.Craft,
    weight: 4,
    label: 'Letters squeezed together',
    evaluate: (ctx) => {
      const match = ctx.styles.appliedCss.match(
        /(?<![\w-])letter-spacing\s*:\s*-0?\.(?:0[5-9]|[1-9])\d*em/i,
      );
      if (match !== null) return match[0].trim();
      return evidence(
        ctx.usesClass(/\btracking-tighter\b/),
        'headline letters are pulled tight enough to touch',
      );
    },
  }),

  defineRule({
    id: 'impeccable.numbered-section-labels',
    category: RuleCategory.Craft,
    weight: 3,
    label: 'Sections numbered 01, 02, 03',
    evaluate: (ctx) => {
      const distinct = new Set([...ctx.html.matchAll(/>\s*(0[1-9])\s*</g)].map((m) => m[1]));
      return evidence(distinct.size >= 3, plural(distinct.size, 'numbered section label'));
    },
  }),

  defineRule({
    id: 'impeccable.hover-scale-transform',
    category: RuleCategory.Craft,
    weight: 4,
    label: 'Things that grow when you point at them',
    evaluate: (ctx) => {
      if (ctx.usesClass(/\b(?:group-)?hover:scale-1(?:0[5-9]|1\d)\b/))
        return 'cards enlarge on hover, the default flourish';
      // Tailwind compiles hover:scale-105 to --tw-scale-*, never to a literal
      // transform:scale(), which is why matching the literal form missed 33 of 34.
      if (/:hover[^{]{0,140}\{[^}]{0,320}?--tw-scale/i.test(ctx.styles.appliedCss)) {
        return 'cards enlarge on hover, the default flourish';
      }
      return evidence(
        /:hover[^{]{0,80}\{[^}]{0,200}?transform\s*:\s*(?:scale|rotate)\s*\(/i.test(
          ctx.styles.appliedCss,
        ),
        'cards enlarge on hover, the default flourish',
      );
    },
  }),

  defineRule({
    id: 'impeccable.blinking-cursor',
    category: RuleCategory.Craft,
    weight: 3,
    label: 'A fake blinking cursor',
    // Stop at `}` as well as `;`: minified CSS separates rules with `}`, so a
    // permissive class ran out of one declaration into the next selector and
    // fired on 177 of 200 sites.
    evaluate: (ctx) => {
      const keyframes = /@keyframes\s+[\w-]*(?:blink|caret|typing)[\w-]*\s*\{/i.test(
        ctx.styles.appliedCss,
      );
      const animation = /animation(?:-name)?\s*:[^;}]*\b(?:blink|caret)\b/i.test(
        ctx.styles.appliedCss,
      );
      return evidence(keyframes || animation, 'text pretends to be typed into a terminal');
    },
  }),

  defineRule({
    id: 'impeccable.cream-palette',
    category: RuleCategory.Craft,
    weight: 3,
    label: 'The warm cream background of the moment',
    // Parsed numerically: the earlier hex alternation was unreadable and matched
    // almost nothing.
    evaluate: (ctx) => {
      const isWarmOffWhite = (r: number, g: number, b: number): boolean =>
        r > 238 && g > 230 && b > 205 && r >= g && g >= b && r - b >= 8 && r - b <= 48;

      for (const match of ctx.styles.appliedCss.matchAll(
        /(?<![\w-])background(?:-color)?\s*:\s*#([0-9a-f]{3}|[0-9a-f]{6})\b/gi,
      )) {
        const raw = match[1] ?? '';
        const hex =
          raw.length === 3
            ? raw
                .split('')
                .map((c) => c + c)
                .join('')
            : raw;
        const n = Number.parseInt(hex, 16);
        if (isWarmOffWhite((n >> 16) & 255, (n >> 8) & 255, n & 255)) return `#${hex}`;
      }
      return evidence(
        ctx.usesClass(/\bbg-(?:amber|orange|stone|yellow)-(?:50|100)\b/),
        'the tasteful off-white every generated page reaches for',
      );
    },
  }),

  defineRule({
    id: 'impeccable.monotonous-spacing',
    category: RuleCategory.Craft,
    weight: 3,
    label: 'Every gap the same size',
    evaluate: (ctx) => {
      const gaps = [...ctx.document.classText.matchAll(/\b(?:gap|space-[xy])-(\d{1,2})\b/g)].map(
        (m) => m[1],
      );
      if (gaps.length < 6) return null;
      const distinct = new Set(gaps);
      return evidence(distinct.size === 1, `every gap is ${[...distinct][0]}`);
    },
  }),

  defineRule({
    id: 'impeccable.shape-assembled-illustration',
    category: RuleCategory.Craft,
    weight: 3,
    label: 'Illustrations built from basic shapes',
    evaluate: (ctx) => {
      for (const match of ctx.html.matchAll(/<svg\b[\s\S]{0,4000}?<\/svg>/gi)) {
        const svg = match[0];
        const primitives = countMatches(svg, /<(?:circle|rect|ellipse|polygon)\b/gi);
        const paths = countMatches(svg, /<path\b/gi);
        // Many primitives and almost no paths reads as assembled clip art.
        if (primitives >= 6 && paths <= 1) return `${primitives} primitives, ${paths} paths`;
      }
      return null;
    },
  }),

  defineRule({
    id: 'impeccable.flat-type-hierarchy',
    category: RuleCategory.Craft,
    weight: 4,
    label: 'Every text size nearly the same',
    evaluate: (ctx) => {
      const px = [
        ...ctx.styles.appliedCss.matchAll(/(?<![\w-])font-size\s*:\s*(\d{1,3}(?:\.\d+)?)px/gi),
      ]
        .map((m) => Number(m[1]))
        .filter((n) => n >= 11 && n <= 96);
      const sizes = [...new Set(px)].sort((a, b) => a - b);
      if (sizes.length < 4) return null;
      // A real ramp has at least one big jump between consecutive steps.
      const ratios = sizes.slice(1).map((value, i) => value / (sizes[i] ?? 1));
      const biggest = Math.max(...ratios);
      return evidence(biggest < 1.25, `${sizes.length} sizes, largest step x${biggest.toFixed(2)}`);
    },
  }),

  defineRule({
    id: 'impeccable.single-font',
    category: RuleCategory.Craft,
    weight: 3,
    label: 'One font doing every job',
    evaluate: (ctx) => {
      const families = new Set<string>();
      for (const match of ctx.styles.appliedCss.matchAll(
        /(?<![\w-])font-family\s*:\s*([^;}]{3,120})/gi,
      )) {
        const first = ((match[1] ?? '').split(',')[0] ?? '')
          .trim()
          .replace(/^["']|["']$/g, '')
          .toLowerCase();
        // Generic fallbacks are not a typographic choice.
        if (
          first !== '' &&
          !/^(inherit|initial|unset|var\(|sans-serif|serif|monospace|system-ui|ui-\w+)/.test(first)
        ) {
          families.add(first);
        }
      }
      // A two-rule stylesheet proves nothing.
      if (ctx.styles.appliedCss.length < 2000) return null;
      return evidence(families.size === 1, `only ${[...families][0]}`);
    },
  }),

  defineRule({
    id: 'impeccable.theater-phrase',
    category: RuleCategory.Copy,
    weight: 4,
    label: 'The "it is just theatre" line',
    evaluate: (ctx) =>
      ctx.content.lower
        .match(
          /\b(?:is|was|just|mere(?:ly)?|nothing but|pure)\s+(?:\w+\s+){0,2}theat(?:er|re)\b/,
        )?.[0]
        .trim() ?? null,
  }),

  defineRule({
    id: 'impeccable.undersized-functional-text',
    category: RuleCategory.Quality,
    weight: 4,
    label: 'Text too small to read',
    evaluate: (ctx) => {
      const match = ctx.styles.appliedCss.match(
        /(?:^|[{;])\s*(?<![\w-])font-size\s*:\s*([4-9](?:\.\d+)?|10)px/i,
      );
      if (match !== null) return `buttons and labels set at ${match[1]}px`;
      return evidence(
        ctx.usesClass(/\btext-\[(?:[0-9]|10)px\]/),
        'buttons and labels set below 11px',
      );
    },
  }),

  defineRule({
    id: 'impeccable.all-caps-body',
    category: RuleCategory.Quality,
    weight: 3,
    label: 'Long passages in capitals',
    // We recognise words by shape, and uppercase removes it.
    evaluate: (ctx) => {
      const runs = ctx.content.text.match(/\b[A-Z][A-Z\s,.'’-]{60,}\b/g) ?? [];
      const real = runs.filter(
        (run) => run.split(/\s+/).filter((word) => word.length > 2).length >= 10,
      );
      return evidence(
        real.length > 0,
        `${real.length} uppercase passage${real.length > 1 ? 's' : ''}`,
      );
    },
  }),

  defineRule({
    id: 'impeccable.wide-tracking-body',
    category: RuleCategory.Quality,
    weight: 3,
    label: 'Body text spaced too wide to read',
    // The selector must be a complete token: a bare `p` in an alternation also
    // matches the "p" inside "letter-spacing", which fired on every Tailwind
    // build's own .tracking-widest definition — 149 false positives.
    evaluate: (ctx) =>
      evidence(
        /(?:^|[}\s,])(?:body|p|\.(?:body|prose|content|copy)[\w-]*)\s*(?:,[^{]{0,60})?\{[^}]{0,200}?(?<![\w-])letter-spacing\s*:\s*0?\.(?:0[6-9]|[1-9])\d*em/i.test(
          ctx.styles.appliedCss,
        ),
        'letters pushed apart far enough to break word shapes',
      ),
  }),

  defineRule({
    id: 'impeccable.repeated-text-in-container',
    category: RuleCategory.Quality,
    weight: 3,
    label: 'The same words repeated inside one card',
    evaluate: (ctx) => {
      for (const container of ctx.html.matchAll(
        /<(article|li|div)\b[^>]*>([\s\S]{0,1200}?)<\/\1>/gi,
      )) {
        const texts = [...(container[2] ?? '').matchAll(/>([^<>]{6,60})</g)]
          .map((m) => (m[1] ?? '').replace(/\s+/g, ' ').trim().toLowerCase())
          .filter((text) => text !== '' && !/^\W+$/.test(text));
        if (texts.length < 3) continue;

        const counts = new Map<string, number>();
        for (const text of texts) counts.set(text, (counts.get(text) ?? 0) + 1);
        const duplicate = [...counts.entries()].find(([, n]) => n >= 3);
        if (duplicate !== undefined) {
          return `"${duplicate[0].slice(0, 34)}" x${duplicate[1]} in one container`;
        }
      }
      return null;
    },
  }),

  defineRule({
    id: 'impeccable.low-contrast',
    category: RuleCategory.Quality,
    weight: 4,
    label: 'Text too faint against its background',
    evaluate: (ctx) => {
      const bad = colorPairs(ctx.styles.appliedCss).filter(
        ([fg, bg]) => contrastRatio(fg, bg) < 4.5,
      );
      return evidence(bad.length > 0, `${bad.length} pair${bad.length > 1 ? 's' : ''} under 4.5:1`);
    },
  }),

  defineRule({
    id: 'impeccable.gray-on-colored',
    category: RuleCategory.Quality,
    weight: 3,
    label: 'Grey text on a coloured background',
    evaluate: (ctx) => {
      const bad = colorPairs(ctx.styles.appliedCss).filter(([fg, bg]) => {
        const isGray = Math.max(...fg) - Math.min(...fg) < 18;
        const isColoured = Math.max(...bg) - Math.min(...bg) > 24;
        return isGray && isColoured && contrastRatio(fg, bg) < 7;
      });
      return evidence(
        bad.length > 0,
        `${bad.length} gray-on-colour pair${bad.length > 1 ? 's' : ''}`,
      );
    },
  }),
];
