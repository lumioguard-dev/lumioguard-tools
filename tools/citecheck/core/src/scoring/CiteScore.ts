import {
  CITATION_BLOCKING_CEILING,
  CITATION_MAX,
  CITATION_MIN,
  type CitationTier,
  type Impact,
  citationBandFor,
} from '@lumioguard/shared';
import type { CiteFinding } from '../domain/CiteFinding.js';

/**
 * Findings to a citation score (0-100, higher is BETTER) and a tier.
 *
 * CALIBRATED AGAINST PAGES THAT ARE DEMONSTRABLY FOUND AND QUOTED. The corpus
 * is two sets. Six technical references every answer engine quotes daily:
 * Wikipedia, MDN, and the Python, React, nginx and Postgres docs. And twenty
 * popular pages across news, retail, health, recipes, reference, government and
 * SaaS: the BBC, the Guardian, the New York Times, CNN, IKEA, Britannica,
 * Healthline, the NHS, Apple, Nike, GOV.UK, Shopify and the rest.
 *
 * The rule that fixes the numbers is that such a page must come out Legible,
 * because nothing is in fact standing in its way.
 *
 * That corpus overturned most of a first cut made from intuition. Five of the
 * six references ship no JSON-LD at all; four carry no meta description; two
 * have no `h1`; three have no canonical. None of those can be a barrier when
 * the most-cited pages on the web are missing them, so every one is minor. At
 * the previous weights the nginx reference landed in the top band, about a
 * served HTML page that is quoted constantly.
 *
 * `minor` is 2 rather than 4 because minors legitimately co-occur: nginx
 * carries eight and must still be Legible, and at 4 it was not.
 *
 * The floor is definitional rather than measured, which is why no corpus moves
 * it. One blocker pins the score into the top band on its own: a page that says
 * noindex, or serves no text without JavaScript, or answers a crawler with 403,
 * cannot be found or quoted whatever else is true of it.
 */
const WEIGHT: Record<Impact, number> = { blocker: 34, major: 10, minor: 2, absent: 0 };

/**
 * What one finding costs, for a surface that has to rank findings from several
 * tools against each other. Read FROM the scorer's own table rather than copied
 * beside it: a retuned weight that moved the score but not the ordering would
 * be invisible, because both lists would still look sorted.
 */
export function weightOf(impact: Impact): number {
  return WEIGHT[impact];
}

export interface ScoredCitation {
  readonly score: number;
  readonly tier: CitationTier;
  readonly tierDescription: string;
  readonly counts: Record<Impact, number>;
}

export function scoreCitation(findings: readonly CiteFinding[]): ScoredCitation {
  const counts: Record<Impact, number> = { blocker: 0, major: 0, minor: 0, absent: 0 };
  let sum = 0;
  for (const item of findings) {
    counts[item.impact] += 1;
    sum += WEIGHT[item.impact];
  }

  /**
   * The penalty is subtracted from the top, ONCE, here.
   *
   * The rules produce a cost, because that is what a rule can say. The scale
   * the reader sees runs the other way, and this is the only line that knows
   * it: everything above counts against the page, everything below reads a
   * number where 100 is a page with nothing in its way.
   */
  const capped =
    counts.blocker > 0
      ? Math.min(CITATION_MAX - sum, CITATION_BLOCKING_CEILING)
      : CITATION_MAX - sum;
  const score = Math.max(CITATION_MIN, Math.min(CITATION_MAX, capped));
  const band = citationBandFor(score);

  return { score, tier: band.tier, tierDescription: band.description, counts };
}
