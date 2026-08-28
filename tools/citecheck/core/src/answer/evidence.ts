import { type CiteFinding, finding, when } from '../domain/CiteFinding.js';
import type { PageDocument } from '../read/PageDocument.js';
import { hasType, stringField } from '../structured/jsonLd.js';
import type { LdRead } from '../structured/jsonLd.js';

/** A date as a reader sees it, in the forms English pages actually print. */
const VISIBLE_DATE =
  /\b(?:\d{1,2}\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}?,?\s*\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/i;

/** The schema types that carry a date because being dated is part of the type. */
const DATED_TYPES = [
  'Article',
  'BlogPosting',
  'NewsArticle',
  'TechArticle',
  'ScholarlyArticle',
  'Report',
  'Review',
] as const;

function datedKind(ld: LdRead): boolean {
  return ld.nodes.some((node) => hasType(node, ...DATED_TYPES));
}

/**
 * The only check left in this file, and it survived because it asks the page
 * about its OWN claim: the type it declares has a date field and left it empty.
 * Gated to article types; ungated it fired on six of seven marketing homepages.
 */
export function checkEvidence(page: PageDocument, ld: LdRead): CiteFinding[] {
  const structuredDate = ld.nodes.some(
    (node) =>
      stringField(node, 'dateModified') !== null || stringField(node, 'datePublished') !== null,
  );
  // The WHOLE body, not the content region. `<main>` is trusted absolutely and
  // canva.com's holds seventeen words of a 1,114-word page, so a date printed
  // outside it would have been missed and the page charged for having none.
  const visibleDate = VISIBLE_DATE.test(page.text);

  return when(datedKind(ld) && !visibleDate && !structuredDate, () =>
    finding({
      code: 'answer.undated',
      impact: 'minor',
      area: 'answerability',
      title: 'The page carries no date anywhere',
      detail:
        'This page says it is an article, and nothing visible or structured says when it was written or last changed. Where two pages say different things, the one that can be shown to be current is the one quoted.',
      evidence: null,
      fix: 'Print the last-updated date on the page and mirror it in dateModified.',
    }),
  );
}
