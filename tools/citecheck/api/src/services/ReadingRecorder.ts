import { type RecorderConfig, recorderConfigFor } from '@lumioguard/api-core';
import type { CitationCrawlResponse, CitationResponse, Impact } from '@lumioguard/shared';
import type { Env } from '../http/env.js';

/**
 * Read per request rather than baked into the container: bindings arrive with
 * the request in Workers, and the container is built once per isolate.
 */
export function recorderConfigFrom(env: Env): RecorderConfig | null {
  return recorderConfigFor('citecheck', env.CITECHECK_INGEST_SECRET, env.LUMIOGUARD_API_BASE_URL);
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
    readonly pagesScanned: number;
    readonly rendering: string;
    readonly agents: ReadonlyArray<{ readonly agent: string; readonly access: string }>;
  };
}

/**
 * TRANSLATED, not passed through. The ingest takes only
 * `critical | high | medium | low`, and `blocker` 400s the whole reading; the
 * recorder fails closed, so the symptom is a reading that never arrives.
 */
const SEVERITY: Record<Impact, 'critical' | 'high' | 'medium' | 'low'> = {
  blocker: 'critical',
  major: 'high',
  minor: 'medium',
  absent: 'low',
};

/**
 * Field by field, not a spread: a spread forwards whatever is added to the wire
 * later. `impact` is sent as `severity`, the envelope all three tools share.
 */
export function readingFrom(report: CitationResponse, host: string): ReadingPayload {
  return {
    entryUrl: report.url,
    host,
    score: report.score,
    tier: report.tier,
    tierDescription: report.tierDescription,
    headline: report.headline,
    findings: report.findings.map((item) => ({
      severity: SEVERITY[item.impact],
      title: item.title,
      detail: item.detail,
      evidence: item.evidence,
    })),
    payload: {
      pagesScanned: 1,
      rendering: report.profile.rendering,
      agents: report.agents.map((posture) => ({
        agent: posture.agent,
        access: posture.access,
      })),
    },
  };
}

export function readingFromCrawl(report: CitationCrawlResponse, host: string): ReadingPayload {
  return {
    entryUrl: report.entry,
    host,
    score: report.site.score,
    tier: report.site.tier,
    tierDescription: report.site.tierDescription,
    headline: report.site.headline,
    findings: report.signals.map((signal) => ({
      severity: SEVERITY[signal.impact],
      title: signal.title,
      detail: signal.detail,
      evidence: signal.evidence,
    })),
    payload: {
      pagesScanned: report.pagesScanned,
      rendering: report.profile.rendering,
      agents: report.agents.map((posture) => ({
        agent: posture.agent,
        access: posture.access,
      })),
    },
  };
}
