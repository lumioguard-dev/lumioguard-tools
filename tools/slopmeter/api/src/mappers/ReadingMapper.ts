import type { CrawlResponse } from '@lumioguard/shared';

/** How many tells travel with a reading. LumioGuard rejects a longer list. */
const MAX_SIGNALS = 10;

/** Decided HERE, because the weight scale is Slopmeter's. */
function severityFor(weight: number): 'high' | 'medium' | 'low' {
  if (weight >= 15) return 'high';
  if (weight >= 6) return 'medium';
  return 'low';
}

/**
 * The reading as LumioGuard stores it. The only place the wire is decided, and
 * nothing here identifies a rule — the rule pack is the product. `findings` is
 * the envelope every tool speaks; `payload` is what only Slopmeter reads.
 */
export function readingFrom(report: CrawlResponse, host: string): Record<string, unknown> {
  // Heaviest first, so a truncated list is the top of the report.
  const signals = [...report.signals].sort((a, b) => b.weight - a.weight).slice(0, MAX_SIGNALS);

  return {
    entryUrl: report.entry,
    host,
    score: report.site.score,
    tier: report.site.tier,
    tierDescription: report.site.tierDescription,
    headline: report.site.headline,
    findings: signals.map((signal) => ({
      severity: severityFor(signal.weight),
      title: signal.label,
      detail: signal.evidence ?? signal.label,
      evidence: signal.evidence,
    })),
    payload: {
      pagesScanned: report.pagesScanned,
      screenshotUrl: report.screenshotUrl,
      // The Slop page plots these; the envelope above has no room for a weight.
      signals: signals.map((signal) => ({
        label: signal.label,
        weight: signal.weight,
        evidence: signal.evidence,
        pages: signal.pages,
        onHomepage: signal.onHomepage,
      })),
    },
  };
}
