import type { FindingDto, ScanResponse } from '@lumioguard/shared';
import type { Finding, ScanResult, TierResolver } from '@lumioguard/slopmeter-core';
import type { ScreenshotProvider } from '../services/ScreenshotProvider.js';

/**
 * Keeps the wire shape a deliberate choice rather than a leak of the domain
 * model, which here is a security boundary, not only a design one. The rule
 * pack is the product: ids, categories and the catalogue itself stay server
 * side, and only what a visitor is actually told crosses the wire.
 */
export class ScanResultMapper {
  private readonly tierResolver: TierResolver;
  private readonly screenshots: ScreenshotProvider;

  public constructor(tierResolver: TierResolver, screenshots: ScreenshotProvider) {
    this.tierResolver = tierResolver;
    this.screenshots = screenshots;
  }

  public toResponse(result: ScanResult, fetchedAt: Date): ScanResponse {
    return {
      url: result.url,
      host: result.host,
      title: result.title,
      score: result.score.value,
      tier: result.tier,
      tierDescription: this.tierResolver.describe(result.score.value),
      headline: result.headline,
      breakdown: {
        value: result.score.value,
        penalties: result.score.penalties,
        credits: result.score.credits,
        creditCap: result.score.creditCap,
        creditApplied: result.score.creditApplied,
      },
      findings: toFindings(result.findings, 'a'),
      quality: toFindings(result.qualityFindings, 'b'),
      provenance: toFindings(result.provenanceFindings, 'c'),
      unassessable: toFindings(result.unassessableFindings, 'd'),
      caveats: {
        isClientRendered: result.caveats.isClientRendered,
        wasTruncated: result.caveats.wasTruncated,
      },
      screenshotUrl: result.url === null ? null : this.screenshots.urlFor(result.url),
      fetchedAt: fetchedAt.toISOString(),
    };
  }
}

/**
 * A rule that threw is dropped rather than reported: its message comes from
 * rule source and would describe the detector's internals to a stranger. The
 * failure is still visible in the Worker's own logs.
 */
export function toFindings(findings: readonly Finding[], prefix: string): FindingDto[] {
  return findings
    .filter((finding) => finding.error === null)
    .map((finding, index) => ({
      id: `${prefix}${index}`,
      label: finding.label,
      weight: finding.weight,
      evidence: finding.evidence,
    }));
}
