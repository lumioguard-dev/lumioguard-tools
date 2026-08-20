import { type CiteFinding, finding, quote, when } from '../domain/CiteFinding.js';
import type { PageDocument } from '../read/PageDocument.js';

/**
 * The heading structure, which is the only map of a page a retriever gets.
 *
 * A model reading a page for an answer works from its headings: they are where
 * one passage stops being about one thing and starts being about another. A
 * page with no outline is one long undifferentiated block, and what comes back
 * from it is whichever few hundred words happened to match.
 */
/** Above this many distinct h1s, the tag is being used as a type size. */
const MANY_H1 = 3;

export function checkOutline(page: PageDocument): CiteFinding[] {
  /**
   * The page's own outline: its content, and only what a reader is offered.
   *
   * Chrome is excluded because a footer's column labels are styling, not
   * structure. `aria-hidden` copies are excluded because they exist to be seen
   * and not read, and stripe.com layers a second, identical `<h1>` for a visual
   * effect: counted, it made the page claim two subjects when it has one.
   */
  const outline = page.headings.filter((heading) => heading.inContent && !heading.hidden);

  const h1s = outline.filter((heading) => heading.level === 1);
  const distinctH1s = new Set(h1s.map((heading) => heading.text.trim().toLowerCase()));
  const empty = outline.filter((heading) => heading.text.trim() === '');

  return [
    ...when(h1s.length === 0 && outline.length > 0, () =>
      finding({
        code: 'document.no-h1',
        impact: 'minor',
        area: 'document',
        title: 'The page has headings but no h1',
        detail:
          'Nothing is marked as the subject of the page, so its outline starts halfway down. What the page is about has to be inferred from a subheading.',
        evidence: quote(outline[0]?.text ?? ''),
        fix: 'Promote the heading that names the page to an h1.',
      }),
    ),
    ...when(outline.length === 0, () =>
      finding({
        code: 'document.no-headings',
        impact: 'minor',
        area: 'document',
        title: 'The page has no headings at all',
        detail:
          'There is no structure to break the page into passages, so anything retrieving from it gets an arbitrary slice of one long block.',
        evidence: null,
        fix: 'Add headings marking where each part of the page begins.',
      }),
    ),
    /**
     * DISTINCT h1s, not h1 elements: a page repeating one heading for a visual
     * effect still has one subject, and counting elements sent stripe.com
     * looking for a second subject it does not have.
     *
     * Graded, because a handful and a hundred are different defects. Two or
     * three is an outline that cannot decide; stripe.com's pricing page carries
     * 112, one per menu card, which is `h1` used as a type size. Reported as
     * "83 top-level subjects" that read like a parser bug, and the markup was
     * exactly what it said.
     */
    ...when(distinctH1s.size > 1, () =>
      distinctH1s.size > MANY_H1
        ? finding({
            code: 'document.h1-as-style',
            impact: 'minor',
            area: 'document',
            title: `The page uses h1 ${h1s.length} times`,
            detail:
              'An h1 marks what a page is about, and this one marks a menu label or a card title. Anything reading the outline is told the page is about that many different things of equal standing.',
            evidence: quote(
              `${distinctH1s.size} distinct, beginning: ${h1s
                .slice(0, 3)
                .map((heading) => heading.text)
                .join(' / ')}`,
            ),
            fix: 'Use one h1 for the page subject and style the rest with CSS.',
          })
        : finding({
            code: 'document.many-h1',
            impact: 'minor',
            area: 'document',
            title: `The page declares ${distinctH1s.size} top-level subjects`,
            detail:
              'More than one h1 means the page claims several subjects of equal standing, and which one it is actually about becomes a guess.',
            evidence: quote(h1s.map((heading) => heading.text).join(' / ')),
            fix: 'Keep one h1 and demote the rest to h2.',
          }),
    ),
    ...when(empty.length > 0, () =>
      finding({
        code: 'document.empty-heading',
        impact: 'minor',
        area: 'document',
        title: 'A heading has no text in it',
        detail:
          'An empty heading is usually a wrapper around an image or an icon. It breaks the outline at that point without naming what follows.',
        evidence: quote(`${empty.length} empty of ${outline.length} headings`),
        fix: 'Put text in the heading, or use a plain element if it is decorative.',
      }),
    ),
  ];
}
