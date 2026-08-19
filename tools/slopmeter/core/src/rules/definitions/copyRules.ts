import { RuleCategory } from '../../domain/RuleCategory.js';
import { type Rule, defineRule } from '../Rule.js';
import { countMatches, distinctHits, evidence, plural } from '../support.js';

const BUZZWORDS = [
  'seamless',
  'seamlessly',
  'effortless',
  'effortlessly',
  'unlock the',
  'elevate your',
  'empower',
  'unleash',
  'game-changer',
  'supercharge',
  'streamline your',
  'revolutionize',
  'cutting-edge',
  'next-generation',
  'best-in-class',
  'industry-leading',
  'world-class',
  'enterprise-grade',
  'mission-critical',
  'future-proof',
  'harness the power',
  'take it to the next level',
] as const;

const AI_VOCABULARY = [
  'delve',
  'tapestry',
  'meticulous',
  'testament to',
  'intricate',
  'realm of',
  'navigate the complexities',
  'pivotal',
  'underscore the',
  'holistic approach',
  'paradigm shift',
  'bespoke',
  'myriad',
  'plethora',
  'comprehensive solution',
] as const;

const FILLER = [
  "in today's fast-paced world",
  "in today's digital age",
  'it is important to note that',
  "it's important to note that",
  'at the end of the day,',
  'more than ever before',
  'the fact of the matter is',
  'needless to say',
  'without further ado',
] as const;

const CONNECTORS = [
  'additionally,',
  'moreover,',
  'furthermore,',
  'consequently,',
  'nevertheless,',
] as const;

export const copyRules: readonly Rule[] = [
  defineRule({
    id: 'copy.buzzwords',
    category: RuleCategory.Copy,
    weight: 12,
    label: 'Marketing buzzwords',
    phrase: 'buzzwords like seamless and effortless',
    evaluate: (ctx) => {
      const hits = distinctHits(ctx.content.lower, BUZZWORDS);
      return evidence(hits.length >= 3, hits.slice(0, 5).join(', '));
    },
  }),

  defineRule({
    id: 'copy.emdash',
    category: RuleCategory.Copy,
    weight: 10,
    label: 'Em-dashes on almost every line',
    phrase: 'em dashes in nearly every line',
    // Density, not a flat count: a long article using a few em-dashes is fine;
    // a short page with one per clause is the tell.
    evaluate: (ctx) => {
      const count = countMatches(ctx.content.text, /: /g);
      if (count < 4) return null;
      const length = Math.max(ctx.content.text.length, 1);
      return evidence(count / length > 1 / 500, `${count} em-dashes in ${length} chars`);
    },
  }),

  defineRule({
    id: 'copy.ai-vocabulary',
    category: RuleCategory.Copy,
    weight: 10,
    label: 'The vocabulary chatbots reach for',
    phrase: 'the vocabulary chatbots reach for',
    evaluate: (ctx) => {
      const hits = distinctHits(ctx.content.lower, AI_VOCABULARY);
      return evidence(hits.length >= 3, hits.slice(0, 5).join(', '));
    },
  }),

  defineRule({
    id: 'copy.emoji-headers',
    category: RuleCategory.Copy,
    weight: 8,
    label: 'Headings that start with an emoji',
    phrase: 'an emoji opening every heading',
    evaluate: (ctx) => {
      const leadingEmoji = /^[\p{Extended_Pictographic}]/u;
      const count = ctx.document.headings.filter((h) => leadingEmoji.test(h.text.trim())).length;
      return evidence(count >= 2, plural(count, 'heading'));
    },
  }),

  defineRule({
    id: 'copy.filler-phrases',
    category: RuleCategory.Copy,
    weight: 8,
    label: 'Filler phrases that say nothing',
    phrase: 'sentences that take a breath and say nothing',
    evaluate: (ctx) => {
      const hits = distinctHits(ctx.content.lower, FILLER);
      return hits.length > 0 ? `"${hits[0]}"` : null;
    },
  }),

  defineRule({
    id: 'copy.negative-parallelism',
    category: RuleCategory.Copy,
    weight: 6,
    label: 'The it-is-not-just-X-it-is-Y construction',
    phrase: 'the not-just-X-but-Y construction',
    evaluate: (ctx) => {
      const { text } = ctx.content;
      if (/\bit(?:'s| is) not just [a-z][^.!?]{2,50}[,.]? it(?:'s| is)\b/i.test(text)) {
        return "it's not just X, it's Y";
      }
      return evidence(
        /\bnot only [a-z][^.!?]{2,50} but also\b/i.test(text),
        'not only X but also Y',
      );
    },
  }),

  defineRule({
    id: 'copy.formal-connectors',
    category: RuleCategory.Copy,
    weight: 5,
    label: 'Stiff connectors: moreover, furthermore',
    phrase: 'connectors like moreover and furthermore',
    evaluate: (ctx) => {
      const hits = distinctHits(ctx.content.lower, CONNECTORS);
      return evidence(hits.length >= 2, `${hits.length} connectors`);
    },
  }),
];
