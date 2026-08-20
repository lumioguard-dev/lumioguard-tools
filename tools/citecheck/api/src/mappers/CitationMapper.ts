import {
  type CiteFinding,
  type PageResult,
  headlineFor,
  orderFindings,
  scoreCitation,
  weightOf,
} from '@lumioguard/citecheck-core';
import type {
  AgentPostureDto,
  CitationFindingDto,
  CitationResponse,
  CitationSourcesDto,
} from '@lumioguard/shared';

/**
 * Findings to the wire response. The internal `code` and the `fix` are both
 * dropped: the id is opaque so a list can be keyed, and the report names the
 * problem without handing out the remediation, which is the reason to continue
 * into LumioGuard.
 *
 * Score, tier and headline are derived here from the same ordered set, so the
 * number and the list can never disagree.
 */
export interface ScanInputs {
  readonly result: PageResult;
  readonly siteFindings: readonly CiteFinding[];
  readonly agents: readonly AgentPostureDto[];
  readonly sources: CitationSourcesDto;
  readonly siteKey: string | null;
  readonly scannedAt: string;
}

export function toWireFinding(item: CiteFinding, index: number): CitationFindingDto {
  return {
    id: `f${index}`,
    impact: item.impact,
    weight: weightOf(item.impact),
    area: item.area,
    title: item.title,
    detail: item.detail,
    evidence: item.evidence,
  };
}

export function toCitationResponse(inputs: ScanInputs): CitationResponse {
  const ordered = orderFindings([...inputs.result.findings, ...inputs.siteFindings]);
  const scored = scoreCitation(ordered);

  return {
    url: inputs.result.url,
    host: inputs.result.host,
    title: inputs.result.title,
    score: scored.score,
    tier: scored.tier,
    tierDescription: scored.tierDescription,
    headline: headlineFor(ordered),
    findings: ordered.map(toWireFinding),
    counts: scored.counts,
    agents: [...inputs.agents],
    profile: inputs.result.profile,
    sources: inputs.sources,
    siteKey: inputs.siteKey,
    scannedAt: inputs.scannedAt,
  };
}
