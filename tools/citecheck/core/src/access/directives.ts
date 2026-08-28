import { type CiteFinding, finding, quote, when } from '../domain/CiteFinding.js';
import type { PageDocument } from '../read/PageDocument.js';

/**
 * One instruction delivered two ways: a page can carry a clean `<meta>` and a
 * `noindex` header, and reading only the markup calls that page indexable.
 * `google` and `googlebot` carry the same directives to one crawler.
 */
const DIRECTIVE_META = ['robots', 'googlebot', 'google'] as const;

interface Directive {
  /** Where it was written, quoted so the author can find it. */
  readonly source: string;
  readonly tokens: readonly string[];
}

/**
 * Kept SEPARATE. Joined into one string, the proof of a `noindex` on
 * supabase.com opened with an unrelated `<meta name="googlebot">`: evidence has
 * to point at the thing that caused the finding.
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

/**
 * Sign-in, sign-up and checkout, where `noindex` is the RIGHT call and charging
 * it says a site is broken for doing the correct thing.
 *
 * ACTIONS and transaction steps only. A place that might hold public content is
 * NOT here: `/profile/` and `/dashboard/` were, and on a marketplace a
 * professional's profile is the content that most needs indexing. See the README.
 */
const ACCOUNT_PATH =
  /(^|[/-])(auth|login|log-in|signin|sign-in|signup|sign-up|register|registrarse|logout|sign-out|password|forgot|reset|account|cart|basket|checkout|accedi|registrati|accesso|carrello|acceder|iniciar-sesion|cuenta|carrito|connexion|inscription|compte|panier|anmelden|registrieren|konto|warenkorb|entrar|cadastro)([/.]|$)/i;

/** A field only a sign-in, sign-up or reset form has. */
const PASSWORD_FIELD = /<input[^>]*type=["']?password/i;

/**
 * Two signals, because either alone misses: trovapro.it's register page serves
 * no password field, and its sign-in page sits at a path that could be anything.
 * A hyphen may PRECEDE the word, for `/my-account`, but the segment must end at
 * a slash or a dot, so `/account-management-tips` stays prose.
 */
function isAccountSurface(page: PageDocument): boolean {
  let path: string;
  try {
    path = new URL(page.url).pathname;
  } catch {
    return false;
  }
  return ACCOUNT_PATH.test(path) || PASSWORD_FIELD.test(page.markup);
}

export function checkDirectives(page: PageDocument): CiteFinding[] {
  const directives = directivesOf(page);
  if (directives.length === 0) return [];

  const noindex = sourcesFor(directives, (token) => token === 'noindex' || token === 'none');
  const nosnippet = sourcesFor(directives, forbidsSnippets);
  const noarchive = sourcesFor(directives, (token) => token === 'noarchive');

  // An account surface is FLAGGED, not charged: keeping a login out of an index
  // is correct, and charging it made a site that got this right headline its own
  // sign-in page. The blocker wording leads, so the catalogue documents the check.
  const scored = !isAccountSurface(page);

  return [
    ...when(noindex !== null, () =>
      finding({
        code: 'access.noindex',
        impact: scored ? 'blocker' : 'absent',
        area: 'access',
        title: scored
          ? 'This page tells every engine not to index it'
          : 'This page keeps itself out of search, as an account page should',
        detail: scored
          ? 'A noindex directive removes the page from search and from the retrieval sets answer engines draw on. Nothing else on this reading can matter while it stands.'
          : 'A noindex directive removes the page from search and from the retrieval sets answer engines draw on. On a sign-in, account or checkout page that is the right call, so this is noted and costs nothing.',
        evidence: quote(noindex ?? ''),
        fix: scored
          ? 'Remove the noindex directive from the meta tag and the X-Robots-Tag header.'
          : null,
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
