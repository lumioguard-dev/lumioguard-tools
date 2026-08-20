import { type CiteFinding, finding, quote, when } from '../domain/CiteFinding.js';
import type { PageDocument } from '../read/PageDocument.js';

/**
 * `<meta name="robots">` and the `X-Robots-Tag` header, read together.
 *
 * They are one instruction delivered two ways, and either alone is the whole
 * answer, so both are collected before anything is decided. A page can carry a
 * clean `<meta>` and a `noindex` header, and reading only the markup calls that
 * page indexable.
 *
 * The `google` and `googlebot` names carry the same directives to one crawler
 * and are read for the same reason.
 */
const DIRECTIVE_META = ['robots', 'googlebot', 'google'] as const;

interface Directive {
  /** Where it was written, quoted so the author can find it. */
  readonly source: string;
  readonly tokens: readonly string[];
}

/**
 * Every place the page states a robots directive, kept SEPARATE.
 *
 * Joined into one string, the evidence for a `noindex` on supabase.com read
 * `<meta name="googlebot" content="notranslate"> · X-Robots-Tag: noindex`: the
 * finding was right and the first half of its proof had nothing to do with it.
 * Evidence has to point at the thing that caused the finding.
 */
function directivesOf(page: PageDocument): Directive[] {
  const found: Directive[] = [];

  for (const name of DIRECTIVE_META) {
    const content = page.meta[name];
    if (content === undefined) continue;
    found.push({
      source: `<meta name="${name}" content="${content}">`,
      tokens: split(content),
    });
  }

  const header = page.headers['x-robots-tag'];
  if (header !== undefined) {
    found.push({ source: `X-Robots-Tag: ${header}`, tokens: split(header) });
  }

  return found;
}

function split(value: string): string[] {
  return value
    .toLowerCase()
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token !== '');
}

/** The sources that actually carry a matching token, and nothing else. */
function sourcesFor(
  directives: readonly Directive[],
  matches: (token: string) => boolean,
): string | null {
  const carrying = directives
    .filter((directive) => directive.tokens.some(matches))
    .map((directive) => directive.source);
  return carrying.length === 0 ? null : carrying.join(' · ');
}

/** `max-snippet:0` forbids exactly what `nosnippet` forbids, written as a number. */
function forbidsSnippets(token: string): boolean {
  return token === 'nosnippet' || /^max-snippet:\s*0$/.test(token);
}

export function checkDirectives(page: PageDocument): CiteFinding[] {
  const directives = directivesOf(page);
  if (directives.length === 0) return [];

  const noindex = sourcesFor(directives, (token) => token === 'noindex' || token === 'none');
  const nosnippet = sourcesFor(directives, forbidsSnippets);
  const noarchive = sourcesFor(directives, (token) => token === 'noarchive');

  return [
    ...when(noindex !== null, () =>
      finding({
        code: 'access.noindex',
        impact: 'blocker',
        area: 'access',
        title: 'This page tells every engine not to index it',
        detail:
          'A noindex directive removes the page from search and from the retrieval sets answer engines draw on. Nothing else on this reading can matter while it stands.',
        evidence: quote(noindex ?? ''),
        fix: 'Remove the noindex directive from the meta tag and the X-Robots-Tag header.',
      }),
    ),
    // Checked even when noindex already fired: they are removed separately, and
    // a report that stops at the first blocker sends the author back twice.
    ...when(nosnippet !== null, () =>
      finding({
        code: 'access.nosnippet',
        impact: 'blocker',
        area: 'access',
        title: 'This page forbids anyone quoting it',
        detail:
          'nosnippet permits indexing but bars any text being shown from the page. An answer engine that honours it can reach this page and still has nothing it is allowed to repeat.',
        evidence: quote(nosnippet ?? ''),
        fix: 'Drop nosnippet and max-snippet:0, or raise max-snippet to the length you are willing to have quoted.',
      }),
    ),
    ...when(noarchive !== null, () =>
      finding({
        code: 'access.noarchive',
        impact: 'minor',
        area: 'access',
        title: 'No cached copy may be kept',
        detail:
          'noarchive stops a crawler retaining the page it fetched, so anything answering from it has to refetch and may fall back to a stale third-party summary.',
        evidence: quote(noarchive ?? ''),
        fix: 'Remove noarchive unless a copy of this page genuinely must not persist.',
      }),
    ),
  ];
}
