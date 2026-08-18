import type { PageContext } from '../../analysis/PageContext.js';
import { RuleCategory } from '../../domain/RuleCategory.js';
import { type Rule, defineRule } from '../Rule.js';
import { evidence } from '../support.js';

const onVercel = (ctx: PageContext): boolean =>
  'x-vercel-id' in ctx.headers || /\.vercel\.app$/i.test(ctx.host);

const onNetlify = (ctx: PageContext): boolean =>
  'x-nf-request-id' in ctx.headers ||
  /netlify/i.test(ctx.headers.server ?? '') ||
  /\.netlify\.app$/i.test(ctx.host);

/** A backend is referenced by URL, and API endpoints live in inline config too. */
const usesSupabase = (ctx: PageContext): boolean => /\bsupabase\.co[/"'\s]/i.test(ctx.html);

const usesNext = (ctx: PageContext): boolean => /\/_next\/static\//i.test(ctx.document.assetRefs);

const usesRadix = (ctx: PageContext): boolean =>
  /data-radix/i.test(ctx.html) || /\bradix-ui\b/i.test(ctx.document.assetRefs);

const usesLucide = (ctx: PageContext): boolean =>
  ctx.usesClass(/\blucide(?:-[a-z-]+)?\b/) || /lucide-react/i.test(ctx.document.assetRefs);

const MODERN_BACKENDS = [
  'clerk.com',
  'clerk.dev',
  'convex.dev',
  'planetscale.com',
  'neon.tech',
  'appwrite.io',
  'xano.com',
] as const;

/** Context only: every rule here is reported and scores zero. */
export const stackRules: readonly Rule[] = [
  defineRule({
    id: 'stack.vercel',
    category: RuleCategory.Stack,
    weight: 6,
    label: 'Hosted on Vercel',
    phrase: 'a deploy straight out of the guide',
    evaluate: (ctx) => evidence(onVercel(ctx), 'Vercel headers'),
  }),

  defineRule({
    id: 'stack.netlify',
    category: RuleCategory.Stack,
    weight: 5,
    label: 'Hosted on Netlify',
    evaluate: (ctx) => evidence(onNetlify(ctx), 'Netlify headers'),
  }),

  defineRule({
    id: 'stack.supabase',
    category: RuleCategory.Stack,
    weight: 7,
    label: 'Supabase backend',
    phrase: 'Supabase straight from the quickstart',
    evaluate: (ctx) => evidence(usesSupabase(ctx), 'supabase.co asset'),
  }),

  defineRule({
    id: 'stack.modern-backends',
    category: RuleCategory.Stack,
    weight: 8,
    label: 'AI-build-adjacent backend',
    phrase: 'the backend the walkthrough picked',
    evaluate: (ctx) =>
      MODERN_BACKENDS.find((backend) =>
        new RegExp(`\\b${backend.replace('.', '\\.')}[/"'\\s]`, 'i').test(ctx.html),
      ) ?? null,
  }),

  defineRule({
    id: 'stack.vibe-combo',
    category: RuleCategory.Stack,
    weight: 10,
    label: 'Classic vibe-coding stack',
    phrase: 'the stack the tutorials ship with',
    evaluate: (ctx) =>
      evidence(usesNext(ctx) && onVercel(ctx) && usesSupabase(ctx), 'Next + Vercel + Supabase'),
  }),

  defineRule({
    id: 'stack.shadcn-combo',
    category: RuleCategory.Stack,
    weight: 10,
    label: 'Stock shadcn component stack',
    phrase: "the component library's demo recoloured",
    // Any one of these alone is a normal engineering choice, so only the full
    // set fires: together they are the scaffold every generator emits.
    evaluate: (ctx) =>
      evidence(usesNext(ctx) && usesRadix(ctx) && usesLucide(ctx), 'Next + Radix + lucide'),
  }),
];
