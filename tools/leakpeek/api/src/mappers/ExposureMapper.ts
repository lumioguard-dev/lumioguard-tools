import {
  type ExposureFinding,
  type ScoredExposure,
  headlineFor,
  orderFindings,
  scoreExposure,
  weightOf,
} from '@lumioguard/leakpeek-core';
import type { DetectedStackDto, ExposureFindingDto, ExposureResponse } from '@lumioguard/shared';

/**
 * Findings → the wire response. The internal `code` is dropped and each finding
 * gets an opaque, position-based id: the id exists so a list can be keyed, and
 * carries nothing about the detector. Score, tier and headline are derived here
 * from the ordered set so the number and the top line always agree with the list.
 */
export interface ScanInputs {
  readonly url: string;
  readonly host: string;
  readonly title: string | null;
  readonly stack: DetectedStackDto;
  readonly findings: readonly ExposureFinding[];
  readonly backendProbed: boolean;
  readonly siteKey: string | null;
  readonly scannedAt: string;
}

export function toExposureResponse(inputs: ScanInputs): ExposureResponse {
  const ordered = orderFindings(inputs.findings);
  const scored: ScoredExposure = scoreExposure(ordered);

  // The internal `code` and the `fix` are both dropped here: the id is opaque so
  // a list can be keyed, and the report names the issue without handing out the
  // remediation (see the finding schema).
  const findings: ExposureFindingDto[] = ordered.map((finding, index) => ({
    id: `f${index}`,
    severity: finding.severity,
    weight: weightOf(finding.severity),
    category: finding.category,
    title: finding.title,
    detail: finding.detail,
    evidence: finding.evidence,
  }));

  return {
    url: inputs.url,
    host: inputs.host,
    title: inputs.title,
    score: scored.score,
    tier: scored.tier,
    tierDescription: scored.tierDescription,
    headline: headlineFor(ordered),
    stack: inputs.stack,
    findings,
    counts: scored.counts,
    backendProbed: inputs.backendProbed,
    siteKey: inputs.siteKey,
    scannedAt: inputs.scannedAt,
  };
}
