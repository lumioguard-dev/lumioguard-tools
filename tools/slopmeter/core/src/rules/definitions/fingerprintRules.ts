import { RuleCategory } from '../../domain/RuleCategory.js';
import { type Rule, defineRule } from '../Rule.js';
import { evidence } from '../support.js';

const MISC_BUILDERS = [
  'create.xyz',
  'durable.co',
  'mixo.io',
  '10web.io',
  'dorik.com',
  'softr.io',
  'carrd.co',
  'typedream.com',
  'dora.run',
  'rocket.new',
  'tempo.new',
  'databutton.com',
  'emergent.sh',
  'wegic.ai',
  'lazy.so',
  'a0.dev',
  'trickle.so',
  'softgen.ai',
  'bubble.io',
  'glide.page',
] as const;

const BADGE =
  /\b(?:made|built|created|generated|powered)\s+(?:with|in|by)\s+(v0|lovable|bolt\.new|bolt|replit|framer|webflow|wix|base44|bubble|durable|softr|carrd|dorik)\b/i;

/**
 * Every rule here is reported and scores ZERO. Building with a tool is not the
 * offence; shipping its untouched defaults is. Weights are retained only so the
 * catalogue stays comparable with the published scale it was ported from.
 */
export const fingerprintRules: readonly Rule[] = [
  defineRule({
    id: 'fingerprint.v0',
    category: RuleCategory.Fingerprint,
    weight: 35,
    label: 'Built with v0',
    phrase: "v0's own marker still in the source",
    evaluate: (ctx) => {
      const proof = ctx.builtWith('v0.dev') ?? ctx.builtWith('v0.app');
      return proof === null ? null : `v0 ${proof}`;
    },
  }),

  defineRule({
    id: 'fingerprint.lovable',
    category: RuleCategory.Fingerprint,
    weight: 35,
    label: 'Built with Lovable',
    phrase: "Lovable's marker left in place",
    evaluate: (ctx) => {
      if (/data-lov-id/i.test(ctx.html)) return 'data-lov-id attribute';
      if (/gpteng\.co|gptengineer/i.test(ctx.document.assetRefs)) return 'gptengineer script';
      return evidence(/\.lovable\.app$/i.test(ctx.host), 'lovable.app subdomain');
    },
  }),

  defineRule({
    id: 'fingerprint.bolt',
    category: RuleCategory.Fingerprint,
    weight: 35,
    label: 'Built with Bolt',
    phrase: "Bolt's fingerprint never taken off",
    evaluate: (ctx) => {
      const proof = ctx.builtWith('bolt.new');
      return proof === null ? null : `bolt.new ${proof}`;
    },
  }),

  defineRule({
    id: 'fingerprint.base44',
    category: RuleCategory.Fingerprint,
    weight: 32,
    label: 'Built with Base44',
    phrase: "Base44's fingerprint in the source",
    evaluate: (ctx) => {
      if (/\.base44\.app$/i.test(ctx.host)) return 'base44.app subdomain';
      const proof = ctx.builtWith('base44.app') ?? ctx.builtWith('base44.com');
      return proof === null ? null : `Base44 ${proof}`;
    },
  }),

  defineRule({
    id: 'fingerprint.replit',
    category: RuleCategory.Fingerprint,
    weight: 35,
    label: 'Hosted on Replit',
    phrase: 'a prototype still running where it was built',
    evaluate: (ctx) =>
      evidence(/\.(replit\.app|repl\.co|replit\.dev)$/i.test(ctx.host), 'Replit subdomain'),
  }),

  defineRule({
    id: 'fingerprint.framer',
    category: RuleCategory.Fingerprint,
    weight: 28,
    label: 'Made with Framer',
    phrase: 'Framer still saying it made this',
    evaluate: (ctx) => {
      if (ctx.document.generator.includes('framer')) return 'Framer generator tag';
      return evidence(/framerusercontent\.com/i.test(ctx.document.assetRefs), 'Framer asset host');
    },
  }),

  defineRule({
    id: 'fingerprint.webflow',
    category: RuleCategory.Fingerprint,
    weight: 26,
    label: 'Made with Webflow',
    phrase: "Webflow's signature never removed",
    evaluate: (ctx) => {
      if (ctx.document.generator.includes('webflow')) return 'Webflow generator tag';
      if (/\bdata-wf-(?:page|site|domain)\b/i.test(ctx.html)) return 'Webflow data attributes';
      return evidence(
        /website-files\.com|webflow\.com\/api/i.test(ctx.document.assetRefs),
        'Webflow asset host',
      );
    },
  }),

  defineRule({
    id: 'fingerprint.wix',
    category: RuleCategory.Fingerprint,
    weight: 24,
    label: 'Made with Wix',
    phrase: 'a Wix build that says so itself',
    evaluate: (ctx) => {
      if (ctx.document.generator.includes('wix.com')) return 'Wix generator tag';
      if (/static\.wixstatic\.com|parastorage\.com/i.test(ctx.document.assetRefs)) {
        return 'Wix asset host';
      }
      return evidence(/\.wixsite\.com$/i.test(ctx.host), 'wixsite.com subdomain');
    },
  }),

  defineRule({
    id: 'fingerprint.ai-builder-misc',
    category: RuleCategory.Fingerprint,
    weight: 22,
    label: 'AI site-builder artifact',
    phrase: "a site builder's artifact in the source",
    evaluate: (ctx) => {
      for (const builder of MISC_BUILDERS) {
        const proof = ctx.builtWith(builder);
        if (proof !== null) return `${builder} ${proof}`;
      }
      return null;
    },
  }),

  defineRule({
    id: 'fingerprint.made-with-badge',
    category: RuleCategory.Fingerprint,
    weight: 18,
    label: 'Builder attribution badge',
    phrase: "the builder's badge still doing its marketing",
    evaluate: (ctx) => {
      const match = ctx.content.text.match(BADGE);
      if (match === null) return null;
      const builder = (match[1] ?? '').toLowerCase().replace('.new', '');
      // The builder's own marketing copy is not a badge on someone else's site.
      if (ctx.host.includes(builder)) return null;
      return evidence(ctx.document.assetRefs.includes(builder), match[0]);
    },
  }),
];
