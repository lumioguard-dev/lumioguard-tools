import type { DetectedStackDto } from '@lumioguard/shared';
import type { ExposureFinding } from './domain/ExposureFinding.js';
import { detectStack } from './passive/fingerprint.js';
import { checkSecurityHeaders } from './passive/headers.js';
import { checkPrivacy } from './passive/privacy.js';
import { scanForSecrets } from './passive/secrets.js';
import { sourceMapPointer } from './passive/sourceMaps.js';
import { type SupabaseTarget, discoverSupabase } from './passive/supabaseDiscovery.js';

export interface FetchedScript {
  readonly url: string;
  readonly body: string;
}

export interface PassiveInput {
  readonly url: string;
  readonly host: string;
  readonly html: string;
  readonly headers: Record<string, string>;
  readonly scripts: readonly FetchedScript[];
}

export interface PassiveResult {
  readonly stack: DetectedStackDto;
  readonly findings: readonly ExposureFinding[];
  readonly supabase: SupabaseTarget | null;
  readonly sourceMapCandidates: readonly string[];
}

/**
 * Pure: derived entirely from what the api already downloaded, so the engine
 * needs no network and the same input always gives the same findings.
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

  const sourceMapCandidates: string[] = [];
  for (const script of input.scripts) {
    const pointer = sourceMapPointer(script.body);
    if (pointer === null) continue;
    try {
      sourceMapCandidates.push(new URL(pointer, script.url).href);
    } catch {
      // A pointer that will not resolve is not a candidate.
    }
  }

  return { stack, findings, supabase, sourceMapCandidates };
}
