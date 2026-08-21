import { type CiteFinding, finding, quote, when } from '../domain/CiteFinding.js';
import type { PageDocument } from '../read/PageDocument.js';
import { type LdNode, type LdRead, typesOf } from './jsonLd.js';

/**
 * What the page states about itself in a form a machine can read without
 * guessing, and where those statements are missing or contradict the prose.
 *
 * The one that matters most is the entity: an answer engine has to decide WHO
 * a page is about before it can attribute anything to them, and a site that
 * never says so in machine-readable form gets whatever the engine infers from
 * the domain name.
 */
export function checkClaims(page: PageDocument, ld: LdRead): CiteFinding[] {
  const organisation = ld.nodes.find(namesAPublisher);

  return [
    ...when(ld.blockCount === 0, () =>
      finding({
        code: 'structured.absent',
        impact: 'absent',
        area: 'structured',
        title: 'The page makes no machine-readable claims about itself',
        detail:
          'There is no JSON-LD, so what this page is, who published it and when are all left to be inferred from the prose. Everything an engine gets about this page it had to guess.',
        evidence: null,
        fix: 'Add a JSON-LD block naming the page type, the publisher and the dates.',
      }),
    ),
    ...when(ld.invalid.length > 0, () =>
      finding({
        code: 'structured.invalid',
        impact: 'major',
        area: 'structured',
        title: 'The structured data does not parse',
        detail:
          'A JSON-LD block on this page is malformed. Consumers skip a block they cannot read without reporting anything, so the markup looks present and counts for nothing.',
        evidence: quote(ld.invalid[0] ?? ''),
        fix: 'Fix the JSON syntax in the ld+json block; a trailing comma is the usual cause.',
      }),
    ),
    ...when(ld.blockCount > 0 && ld.nodes.every((node) => typesOf(node).length === 0), () =>
      finding({
        code: 'structured.untyped',
        impact: 'minor',
        area: 'structured',
        title: 'The structured data declares no type',
        detail:
          'The JSON-LD parses but no node carries an @type, so nothing in it can be matched to a schema. It describes something, and never says what.',
        evidence: null,
        fix: 'Give each node an @type from schema.org.',
      }),
    ),
    ...when(ld.blockCount > 0 && organisation === undefined, () =>
      finding({
        code: 'structured.no-entity',
        impact: 'minor',
        area: 'structured',
        title: 'Nothing here says who publishes this',
        detail:
          'No Organization or Person node names the publisher. An answer engine attributing this page has nothing to attribute it to, so it resolves the entity from the domain and whatever else it has already read about it.',
        evidence: null,
        fix: 'Add an Organization node with name, url and sameAs links to your other profiles.',
      }),
    ),
    ...when(
      page.property['og:title'] === undefined && page.property['og:description'] === undefined,
      () =>
        finding({
          code: 'structured.no-opengraph',
          impact: 'absent',
          area: 'structured',
          title: 'No OpenGraph tags',
          detail:
            'Nothing describes how this page should appear when it is quoted or shared. What gets shown is then assembled from the markup, which is a guess at what the page is called.',
          evidence: null,
          fix: 'Add og:title, og:description and og:image.',
        }),
    ),
  ];
}

/**
 * Whether a node names who publishes the page.
 *
 * Matched on the schema.org NAMING CONVENTION rather than an exact list.
 * `Organization` has dozens of subtypes and an exact match missed the one the
 * news sites use: bbc.com, cnn.com and nytimes.com all declare
 * `NewsMediaOrganization`, and all three were reported as never saying who
 * publishes them. Every subtype carries `Organization` or `Business` in its
 * name, which is what this looks for.
 */
function namesAPublisher(node: LdNode): boolean {
  return typesOf(node).some((type) => {
    if (type === 'Person' || type === 'Corporation') return true;
    return type.includes('Organization') || type.includes('Business');
  });
}
