import type { DetectedStackDto } from '@lumioguard/shared';
import type { ExposureFinding } from './domain/ExposureFinding.js';
import { detectStack } from './passive/fingerprint.js';
import { checkSecurityHeaders } from './passive/headers.js';
import { checkPrivacy } from './passive/privacy.js';
import { scanForSecrets } from './passive/secrets.js';
import { sourceMapPointer } from './passive/sourceMaps.js';
import { type SupabaseTarget, discoverSupabase } from './passive/supabaseDiscovery.js';

/** One script the page loaded: where it came from, and its body. */
export interface FetchedScript {
  readonly url: string;
  readonly body: string;
}

/** Everything the api fetched from the served page, for passive analysis. */
export interface PassiveInput {
  readonly url: string;
  readonly host: string;
  readonly html: string;
  readonly headers: Record<string, string>;
  readonly scripts: readonly FetchedScript[];
}

/**
 * The result of reading the served page: findings that need no probing, the
 * detected stack, and the two things the active tier acts on — a Supabase target
 * to read, and source-map URLs to check for reachability.
 */
export interface PassiveResult {
  readonly stack: DetectedStackDto;
  readonly findings: readonly ExposureFinding[];
  readonly supabase: SupabaseTarget | null;
  readonly sourceMapCandidates: readonly string[];
}

/**
 * Read the served page. Pure: everything here is derived from what the browser
 * already downloaded, so it runs without a network and the same input always
 * gives the same findings.
 */
export function analyzePassive(input: PassiveInput): PassiveResult {
  const sources = [input.html, ...input.scripts.map((script) => script.body)].join('\n');

  const findings: ExposureFinding[] = [
    ...scanForSecrets(sources),
    ...checkSecurityHeaders(input.headers),
    ...checkPrivacy(input.html, sources),
  ];

  const stack = detectStack({ headers: input.headers, sources, host: input.host });
  const supabase = discoverSupabase(sources);

  // Resolve each script's sourceMappingURL pointer against the script's own URL,
  // so the api has an absolute address to check for reachability.
  const sourceMapCandidates: string[] = [];
  for (const script of input.scripts) {
    const pointer = sourceMapPointer(script.body);
    if (pointer === null) continue;
    try {
      sourceMapCandidates.push(new URL(pointer, script.url).href);
    } catch {
      // A pointer that will not resolve is not a candidate; skip it.
    }
  }

  return { stack, findings, supabase, sourceMapCandidates };
}
