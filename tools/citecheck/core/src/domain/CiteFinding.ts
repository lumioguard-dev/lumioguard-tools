import type { CiteArea, Impact } from '@lumioguard/shared';

/** One thing between this page and being quoted, as the engine produces it. */
export interface CiteFinding {
  /** Internal. Never crosses the wire; see the mapper. */
  readonly code: string;
  readonly impact: Impact;
  readonly area: CiteArea;
  readonly title: string;
  readonly detail: string;
  /**
   * Quoted back rather than paraphrased: a finding the author cannot locate in
   * their own source is one they cannot act on. Null when the finding is the
   * ABSENCE of something, which has no line to quote.
   */
  readonly evidence: string | null;
  /** The one change that closes it, written for whoever ships the site. */
  readonly fix: string | null;
}

/**
 * Worst first, then by code so a report's order is stable across readings.
 * `absent` sorts last: it is a flag, not a severity, so what costs something is
 * read first and what is simply not there follows.
 */
const IMPACT_RANK: Record<Impact, number> = { blocker: 0, major: 1, minor: 2, absent: 3 };

/**
 * Generic in the finding, so a crawl's rolled-up signals keep the fields the
 * roll-up added. Typed to `CiteFinding` it silently widened them back, and the
 * extra fields survived at runtime while the compiler denied they were there.
 */
export function orderFindings<T extends CiteFinding>(findings: readonly T[]): T[] {
  return [...findings].sort((a, b) => {
    const byImpact = IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact];
    return byImpact !== 0 ? byImpact : a.code.localeCompare(b.code);
  });
}

export function finding(init: CiteFinding): CiteFinding {
  return init;
}

/**
 * Every detector returns a list, and most return one item or none. This keeps
 * that shape at the call site without an `if` around every `push`.
 */
export function when(condition: boolean, produce: () => CiteFinding): CiteFinding[] {
  return condition ? [produce()] : [];
}

/** Evidence is quoted from the page, so it needs a ceiling. */
const EVIDENCE_MAX = 160;

export function quote(raw: string): string {
  const flat = raw.replace(/\s+/g, ' ').trim();
  return flat.length <= EVIDENCE_MAX ? flat : `${flat.slice(0, EVIDENCE_MAX - 1)}…`;
}
