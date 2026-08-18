import { RuleCategory } from '../../domain/RuleCategory.js';
import { type Rule, defineRule } from '../Rule.js';
import { countMatches, evidence, firstMatch, plural } from '../support.js';

const TRACKERS = [
  'googletagmanager.com',
  'google-analytics.com',
  'connect.facebook.net',
  'hotjar.com',
  'segment.com',
  'segment.io',
  'mixpanel.com',
  'intercom.io',
  'clarity.ms',
  'doubleclick.net',
  'linkedin.com/px',
  'posthog.com',
  'amplitude.com',
  'fullstory.com',
  'sentry.io',
  'snap.licdn.com',
] as const;

/** Written once and composed into the four patterns below. */
const PLACEHOLDER_HOST = String.raw`(?:example|yourdomain|yourcompany|yoursite|domain)\.(?:com|org)`;

const PLACEHOLDER_EMAIL = new RegExp(String.raw`\b[a-z0-9._-]+@${PLACEHOLDER_HOST}\b`, 'gi');
const DEAD_MAILTO = new RegExp(String.raw`mailto:[^"'\s>]*@${PLACEHOLDER_HOST}`, 'i');

/** 555-0100 through 555-0199 is the block the NANP reserves for fiction. */
const FICTIONAL_PHONE = /\b(?:555-01\d{2}|123-456-7890)\b/g;
const DEAD_TEL = /tel:[^"'\s>]*(?:555-?01\d{2}|123-?456-?7890)/i;

/**
 * An invitation to make contact — not the bare word "email", which on a page
 * worth reading is a column header, a form label or a feature name.
 */
const CONTACT_INTENT =
  /\b(?:contact us|email us|call us|get in touch|reach us|reach out|write to us|drop us a line)\b/i;

/** How far either side of the match an invitation still counts as attached. */
const CONTACT_WINDOW = 140;

/**
 * The placeholder, but only where the page is asking to be contacted near it.
 * Every occurrence is checked rather than the first: a demo table can sit above
 * a footer that really did keep the template's address.
 */
function nearContactIntent(prose: string, pattern: RegExp): string | null {
  for (const match of prose.matchAll(pattern)) {
    const at = match.index ?? 0;
    const from = Math.max(0, at - CONTACT_WINDOW);
    if (CONTACT_INTENT.test(prose.slice(from, at + match[0].length + CONTACT_WINDOW))) {
      return match[0];
    }
  }
  return null;
}

const STOCK_HERO_PATTERNS = [
  /\bthe (?:all-in-one|only|ultimate) (?:platform|solution|tool) (?:for|to)\b/i,
  /\bbuild (?:beautiful|stunning|amazing) [a-z ]{3,30} in (?:minutes|seconds)\b/i,
  /\b(?:everything|all) you need to [a-z ]{3,40}, (?:in one place|all in one)\b/i,
  /\bwhere [a-z]{3,15} meets [a-z]{3,15}\b/i,
] as const;

export const structureRules: readonly Rule[] = [
  defineRule({
    id: 'leftover.todo-in-production',
    category: RuleCategory.Leftover,
    weight: 9,
    label: 'A developer TODO left in the visible text',
    phrase: "a developer's TODO in the visible copy",
    evaluate: (ctx) =>
      evidence(
        /\b(?:TODO|FIXME|XXX|HACK)\s*[:(]/.test(ctx.content.text),
        'an unfinished note sits where visitors can read it',
      ),
  }),

  defineRule({
    id: 'leftover.placeholder-contact',
    category: RuleCategory.Leftover,
    weight: 8,
    label: 'Fake contact details',
    phrase: 'contact details nobody answers',
    /** The tell is not the address. */
    evaluate: (ctx) => {
      if (DEAD_MAILTO.test(ctx.html)) {
        return `${firstMatch(ctx.html, DEAD_MAILTO)?.replace(/^mailto:/i, '') ?? 'an example address'} is where the page says to write`;
      }
      if (DEAD_TEL.test(ctx.html)) return 'the number to call is one reserved for fiction';

      const address = nearContactIntent(ctx.content.prose, PLACEHOLDER_EMAIL);
      if (address !== null) return `${address} is printed where the page invites contact`;

      const number = nearContactIntent(ctx.content.prose, FICTIONAL_PHONE);
      return number === null ? null : `${number} is a number reserved for fiction`;
    },
  }),

  defineRule({
    id: 'copy.stock-hero',
    category: RuleCategory.Copy,
    weight: 8,
    label: 'A hero line straight from the template',
    phrase: "the template's own hero line",
    evaluate: (ctx) => {
      for (const pattern of STOCK_HERO_PATTERNS) {
        const match = firstMatch(ctx.content.text, pattern);
        if (match !== null) return match.slice(0, 60);
      }
      return null;
    },
  }),

  defineRule({
    id: 'copy.emoji-soup',
    category: RuleCategory.Copy,
    weight: 5,
    label: 'Emoji used as decoration',
    evaluate: (ctx) => {
      const count = countMatches(ctx.content.text, /[\p{Extended_Pictographic}]/gu);
      return evidence(count >= 10, plural(count, 'decorative emoji', 'decorative emoji'));
    },
  }),

  defineRule({
    id: 'structure.nav-goes-nowhere',
    category: RuleCategory.Structure,
    weight: 7,
    label: 'Navigation links that go nowhere',
    phrase: 'navigation that leads nowhere',
    evaluate: (ctx) => {
      const { anchors } = ctx.document;
      if (anchors.length < 8) return null;
      const dead = anchors.filter((a) => {
        const href = a.href.trim();
        return href === '#' || href === '';
      }).length;
      return evidence(dead / anchors.length > 0.6, `${dead}/${anchors.length} links are "#"`);
    },
  }),

  defineRule({
    id: 'structure.thin-shell',
    category: RuleCategory.Structure,
    weight: 6,
    label: 'Almost no text in the page itself',
    phrase: 'almost no text in the page itself',
    evaluate: (ctx) => {
      if (ctx.content.text.length > 700 || ctx.html.length < 3000) return null;
      return `only ${ctx.content.text.length} chars of visible text in ${Math.round(ctx.html.length / 1024)}KB of HTML`;
    },
  }),

  defineRule({
    id: 'structure.oversized-payload',
    category: RuleCategory.Structure,
    weight: 8,
    label: 'A very heavy page',
    phrase: 'megabytes of page for a screenful',
    evaluate: (ctx) => {
      const kb = Math.round(ctx.rawByteLength / 1024);
      return evidence(kb > 500, `${kb}KB of markup before a single image`);
    },
  }),

  defineRule({
    id: 'structure.tracker-pileup',
    category: RuleCategory.Structure,
    weight: 6,
    label: 'A pile-up of third-party trackers',
    phrase: 'more trackers than sections',
    evaluate: (ctx) => {
      const lower = ctx.html.toLowerCase();
      const hits = TRACKERS.filter((tracker) => lower.includes(tracker));
      return evidence(hits.length >= 4, `${hits.length} trackers: ${hits.slice(0, 3).join(', ')}`);
    },
  }),

  defineRule({
    id: 'structure.div-soup',
    category: RuleCategory.Structure,
    weight: 5,
    label: 'Generic boxes instead of real structure',
    evaluate: (ctx) => {
      const { divCount, semanticCount } = ctx.document;
      if (divCount < 150) return null;
      return evidence(
        divCount / Math.max(semanticCount, 1) > 4,
        `${divCount} divs vs ${semanticCount} semantic elements`,
      );
    },
  }),

  defineRule({
    id: 'structure.no-viewport',
    category: RuleCategory.Structure,
    weight: 6,
    label: 'Not set up for phones',
    phrase: 'nothing set up for a phone',
    evaluate: (ctx) =>
      evidence(!ctx.document.meta.viewport, 'the page never declares a mobile viewport'),
  }),

  defineRule({
    id: 'structure.no-h1',
    category: RuleCategory.Structure,
    weight: 5,
    label: 'No main heading',
    evaluate: (ctx) =>
      evidence(
        ctx.document.headings.every((h) => h.level !== 1),
        'nothing on the page is marked as its title',
      ),
  }),

  defineRule({
    id: 'structure.no-canonical',
    category: RuleCategory.Structure,
    weight: 3,
    label: 'No canonical address',
    evaluate: (ctx) =>
      evidence(
        !/rel=["']?canonical/i.test(ctx.html),
        'search engines are not told which address is the real one',
      ),
  }),
];
