import type { DetectedStackDto } from '@lumioguard/shared';

/**
 * What a site's response reveals about the platforms behind it. Reported to
 * choose probes and name the funnel: never scored.
 *
 * Every signal is one the platform EMITS ABOUT ITSELF. Anything weaker is
 * dropped rather than hedged: a reader takes "Cloudflare (a guess)" as
 * "probably Cloudflare", which on a Vercel app behind that CDN is false.
 *
 * `headers` is lower-cased keys; `sources` is the HTML plus script bodies.
 */

export interface Fingerprint {
  readonly headers: Record<string, string>;
  readonly sources: string;
  readonly host: string;
}

/**
 * Where the app is SERVED FROM, and only when the platform says so itself.
 *
 * `cf-ray` is deliberately not enough: it means the request crossed Cloudflare's
 * CDN, which any origin can sit behind. Only `.pages.dev` proves Pages serves it.
 */
function detectHosting(headers: Record<string, string>, host: string): string | null {
  if (headers['x-vercel-id'] || headers.server === 'Vercel') return 'Vercel';
  if (headers['x-nf-request-id']) return 'Netlify';
  if (host.endsWith('.pages.dev') || headers.server === 'cloudflare-pages')
    return 'Cloudflare Pages';
  if (host.endsWith('.web.app') || host.endsWith('.firebaseapp.com')) return 'Firebase Hosting';
  if (headers.server === 'GitHub.com' || host.endsWith('.github.io')) return 'GitHub Pages';
  return null;
}

/**
 * Never from a tool's NAME appearing in the page: a customer list or footer
 * credit mentions "Supabase" without being built on it, which made the line a
 * lie on exactly the sites people try first (stripe.com lists both).
 */
function detectBuilder(sources: string, host: string): string | null {
  // `data-lov-id` is injected by Lovable; a `lovable.dev` link is a mention.
  if (host.endsWith('.lovable.app') || /data-lov-id=|gptengineer/i.test(sources)) return 'Lovable';
  if (host.endsWith('.base44.app') || /\bbase44\.app\/api\//i.test(sources)) return 'Base44';
  if (host.endsWith('.bolt.host') || host.endsWith('.bolt.new')) return 'Bolt';
  if (/data-v0-project|__v0_/i.test(sources)) return 'v0';
  return null;
}

function detectBackend(sources: string): string | null {
  // The actual project endpoint, not the word: the 20-char ref is the tell.
  if (/https?:\/\/[a-z0-9]{20}\.supabase\.co/i.test(sources)) return 'Supabase';
  if (/[a-z0-9-]+\.firebaseio\.com|[a-z0-9-]+\.firebaseapp\.com/i.test(sources)) return 'Firebase';
  if (/[a-z0-9-]+\.pocketbase\.io/i.test(sources)) return 'PocketBase';
  if (/[a-z0-9-]+\.appwrite\.io/i.test(sources)) return 'Appwrite';
  return null;
}

export function detectStack(input: Fingerprint): DetectedStackDto {
  return {
    builder: detectBuilder(input.sources, input.host),
    hosting: detectHosting(input.headers, input.host),
    backend: detectBackend(input.sources),
  };
}
