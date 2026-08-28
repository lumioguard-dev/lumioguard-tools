import { type RecorderConfig, recorderConfigFor } from '@lumioguard/api-core';
import type { ExposureResponse } from '@lumioguard/shared';
import type { Env } from '../http/env.js';

/**
 * Read per request rather than baked into the container: bindings arrive with
 * the request in Workers, and the container is built once per isolate.
 */
export function recorderConfigFrom(env: Env): RecorderConfig | null {
  return recorderConfigFor('leakpeek', env.LEAKPEEK_INGEST_SECRET, env.LUMIOGUARD_API_BASE_URL);
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
export function readingFrom(report: ExposureResponse, host: string): ReadingPayload {
  return {
    entryUrl: report.url,
    host,
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
