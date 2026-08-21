import type { RecorderConfig } from '@lumioguard/api-core';
import type { CitationCrawlResponse, CitationResponse, Impact } from '@lumioguard/shared';
import type { Env } from '../http/env.js';

/**
 * What is Citecheck's about recording a reading. The signing, the transport and
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
  const secret = env.CITECHECK_INGEST_SECRET;
  const base = env.LUMIOGUARD_API_BASE_URL?.replace(/\/$/, '');
  if (!secret || !base) return null;
  return {
    // One intake for every reading tool; the tool is named in the path.
    endpoint: `${base}/api/external/citecheck/readings`,
    secret,
    signatureHeader: 'x-citecheck-signature',
    timestampHeader: 'x-citecheck-timestamp',
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
    readonly pagesScanned: number;
    readonly rendering: string;
    readonly agents: ReadonlyArray<{ readonly agent: string; readonly access: string }>;
  };
}

/**
 * Field by field, not a spread: a spread would carry `scannedAt` and each
 * finding's opaque `id` across a boundary with no use for them, and would
 * forward whatever is added to the wire later.
 *
 * `impact` is sent as `severity` because that is the envelope every tool shares.
 * The ingest sorts readings from three tools into one list, and a field that
 * means the same thing under three names cannot be sorted on.
 */
/**
 * Citecheck's impact ladder to the shared severity vocabulary.
 *
 * TRANSLATED, not passed through. The ingest validates against
 * `critical | high | medium | low`, and sending `blocker` rejected the whole
 * reading with a 400. The recorder fails closed, so the visible symptom was a
 * reading that simply never arrived: no site key, no row, nothing in the app,
 * and a report that looked entirely normal.
 *
 * `absent` is a flag rather than a severity here, and lands at `low`: it is
 * worth listing beside the rest, and it costs the score nothing at either end.
 */
const SEVERITY: Record<Impact, 'critical' | 'high' | 'medium' | 'low'> = {
  blocker: 'critical',
  major: 'high',
  minor: 'medium',
  absent: 'low',
};

export function readingFrom(report: CitationResponse): ReadingPayload {
  return {
    entryUrl: report.url,
    host: report.host,
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

export function readingFromCrawl(report: CitationCrawlResponse): ReadingPayload {
  return {
    entryUrl: report.entry,
    host: report.host,
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
