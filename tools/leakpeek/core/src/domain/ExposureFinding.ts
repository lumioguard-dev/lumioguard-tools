import type { ExposureCategory, Severity } from '@lumioguard/shared';

/** One exposure, as the engine produces it — a superset of the wire finding. */
export interface ExposureFinding {
  readonly code: string;
  readonly severity: Severity;
  readonly category: ExposureCategory;
  readonly title: string;
  readonly detail: string;
  /**
   * STRUCTURAL proof, redacted by construction: that something returned and its
   * shape, never the values. Null when the finding needs no evidence beyond its
   * own title (a missing header is its own proof).
   */
  readonly evidence: string | null;
  /** The one action that closes it, written for whoever shipped the app. */
  readonly fix: string | null;
}

/** Worst first, then by code so a report's order is stable across scans. */
const SEVERITY_RANK: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function orderFindings(findings: readonly ExposureFinding[]): ExposureFinding[] {
  return [...findings].sort((a, b) => {
    const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    return bySeverity !== 0 ? bySeverity : a.code.localeCompare(b.code);
  });
}
