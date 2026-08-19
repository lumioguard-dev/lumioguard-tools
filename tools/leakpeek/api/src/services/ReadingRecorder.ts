import type { RecorderConfig } from '@lumioguard/api-core';
import type { ExposureResponse } from '@lumioguard/shared';
import type { Env } from '../http/env.js';

/**
 * What is Leakpeek's about recording a reading. The signing, the transport and
 * the response handling are one implementation in `@lumioguard/api-core`,
 * because they were written twice and the two copies were the signing code.
 */

/**
 * Read per request: bindings arrive with the request, the container does not.
 *
 * Both halves are required and neither has a default: a fork that sets a secret
 * but no address must not post its readings to somebody else's API.
 */
export function recorderConfigFrom(env: Env): RecorderConfig | null {
  const secret = env.LEAKPEEK_INGEST_SECRET;
  const base = env.LUMIOGUARD_API_BASE_URL?.replace(/\/$/, '');
  if (!secret || !base) return null;
  return {
    // One intake for every reading tool; the tool is named in the path.
    endpoint: `${base}/api/external/leakpeek/readings`,
    secret,
    signatureHeader: 'x-leakpeek-signature',
    timestampHeader: 'x-leakpeek-timestamp',
  };
}

/**
 * The wire LumioGuard's ingest validates. `findings` is the envelope every tool
 * speaks; `payload` is what only this tool's surfaces read.
 */
export interface ReadingPayload {
  readonly entryUrl: string;
  readonly host: string;
  readonly score: number;
  readonly tier: string;
  readonly tierDescription: string;
  readonly headline: string | null;
  readonly findings: ReadonlyArray<{
    readonly severity: string;
    readonly title: string;
    readonly detail: string;
    readonly evidence: string | null;
  }>;
  readonly payload: {
    readonly backendProbed: boolean;
    readonly stack: {
      readonly builder: string | null;
      readonly backend: string | null;
      readonly hosting: string | null;
    };
  };
}

/**
 * Field-by-field, not a spread: a spread would carry `scannedAt` and each
 * finding's opaque `id` across a boundary with no use for them, and would
 * forward whatever is added to the wire later.
 */
export function readingFrom(report: ExposureResponse): ReadingPayload {
  return {
    entryUrl: report.url,
    host: report.host,
    score: report.score,
    tier: report.tier,
    tierDescription: report.tierDescription,
    headline: report.headline,
    findings: report.findings.map((finding) => ({
      severity: finding.severity,
      title: finding.title,
      detail: finding.detail,
      evidence: finding.evidence,
    })),
    payload: {
      backendProbed: report.backendProbed,
      stack: {
        builder: report.stack.builder,
        backend: report.stack.backend,
        hosting: report.stack.hosting,
      },
    },
  };
}
