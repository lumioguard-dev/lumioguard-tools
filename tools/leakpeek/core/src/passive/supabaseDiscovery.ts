import { jwtRole } from './secrets.js';

/** The Supabase project a bundle talks to, discovered from the served client. */
export interface SupabaseTarget {
  readonly url: string;
  readonly ref: string;
  readonly apiKey: string;
}

const PROJECT_URL = /https?:\/\/([a-z0-9]{20})\.supabase\.co/i;
const JWT = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
const PUBLISHABLE = /\bsb_publishable_[A-Za-z0-9_-]{10,}\b/;

export function discoverSupabase(sources: string): SupabaseTarget | null {
  const project = sources.match(PROJECT_URL);
  const ref = project?.[1];
  if (!ref) return null;
  const url = `https://${ref}.supabase.co`;

  // Prefer the anon-role JWT, the key the app's own client uses.
  for (const token of sources.match(JWT) ?? []) {
    if (jwtRole(token) === 'anon') return { url, ref, apiKey: token };
  }

  // Otherwise the modern publishable key, which serves the same role.
  const publishable = sources.match(PUBLISHABLE);
  if (publishable) return { url, ref, apiKey: publishable[0] };

  return null;
}
