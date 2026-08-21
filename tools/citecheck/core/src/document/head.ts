import { type CiteFinding, finding, quote, when } from '../domain/CiteFinding.js';
import type { PageDocument } from '../read/PageDocument.js';

/**
 * Titles a scaffold ships with. Matched WHOLE, never as a substring: "Vite App"
 * is a default, "Vite Applications Explained" is a real page about one, and a
 * substring match cannot tell them apart.
 */
const STOCK_TITLES: readonly string[] = [
  'vite app',
  'vite + react',
  'vite + react + ts',
  'react app',
  'next app',
  'create next app',
  'nuxt app',
  'svelte app',
  'my app',
  'untitled',
  'document',
  'home',
  'index',
  'new project',
  'site title',
  'my site',
  'webflow site',
  'astro',
];

/**
 * Where a title certainly stops fitting the places it is shown.
 *
 * Set where the claim is UNARGUABLE rather than where the advice usually
 * starts. The rule of thumb is around 60, but a search result gives a title
 * about 600 pixels and the character filling it varies, so at 62 or 66 the tail
 * may well display: nytimes.com, nike.com and blog.hubspot.com were each told
 * their title was cut off when it may not be. Past 75 there is no width at
 * which it fits.
 *
 * There was a floor here too, and it is gone: it called "iPhone - Apple" too
 * short to say what the page is. A character count says nothing about whether a
 * title is any good, and only the long end of it is checkable at all.
 */
const TITLE_MAX = 75;

/**
 * A description shorter than this is a label, not a summary.
 *
 * It was 50, which charged vercel.com for "The autonomous stack for every app
 * and agent." at 45 characters: a deliberate, complete sentence. The floor is
 * only defensible where no sentence can fit, so it sits where "Home", "Welcome"
 * and a bare product name fall and a real one does not.
 */
const DESCRIPTION_MIN = 25;

export function checkHead(page: PageDocument): CiteFinding[] {
  const title = page.title;
  // An empty `content` is no description, not a short one. Reported as thin, a
  // page with `content=""` was told to lengthen something it does not have.
  const written = page.meta.description ?? '';
  const description = written.trim() === '' ? null : written;
  const canonical = page.linkHref('canonical');

  return [
    ...when(title === null || title === '', () =>
      finding({
        code: 'document.no-title',
        impact: 'major',
        area: 'document',
        title: 'The page has no title',
        detail:
          'Nothing names this page. The title is what a citation is labelled with, so anything quoting it has to invent a label from the URL.',
        evidence: null,
        fix: 'Give the page a <title> that names what is on it.',
      }),
    ),
    ...when(title !== null && STOCK_TITLES.includes(title.trim().toLowerCase()), () =>
      finding({
        code: 'document.stock-title',
        impact: 'major',
        area: 'document',
        title: 'The title is the one the scaffold shipped with',
        detail:
          'The page is still called what the framework named it. It says nothing about the content, and every other site built the same way is called it too.',
        evidence: quote(title ?? ''),
        fix: 'Replace the title with one naming this page.',
      }),
    ),
    ...when(title !== null && title.length > TITLE_MAX, () =>
      finding({
        code: 'document.long-title',
        impact: 'minor',
        area: 'document',
        title: `The title runs to ${title?.length} characters`,
        detail:
          'A search result gives a title about 600 pixels, which no line this long fits. Whatever sits at the end of it is not shown, so anything load-bearing has to come first.',
        evidence: quote(title ?? ''),
        fix: 'Put the distinguishing words first and move the site name to the end.',
      }),
    ),
    ...when(description === null, () =>
      finding({
        code: 'document.no-description',
        impact: 'absent',
        area: 'document',
        title: 'No meta description',
        detail:
          'Nothing summarises the page in its own words, so whatever is shown alongside it is assembled from whichever sentence an engine picks out.',
        evidence: null,
        fix: 'Add a meta description summarising the page in one or two sentences.',
      }),
    ),
    ...when(description !== null && description.trim().length < DESCRIPTION_MIN, () =>
      finding({
        code: 'document.thin-description',
        impact: 'minor',
        area: 'document',
        title: 'The description is a fragment',
        detail: `At ${description?.trim().length} characters there is not a summary here, and the space it was meant to fill gets taken from the page body instead.`,
        evidence: quote(description ?? ''),
        fix: 'Write a description that summarises the page rather than labelling it.',
      }),
    ),
    ...when(canonical === null, () =>
      finding({
        code: 'document.no-canonical',
        impact: 'absent',
        area: 'document',
        title: 'No canonical URL',
        detail:
          'Nothing states which address is the real one for this page. Where the same content answers on more than one URL, whichever was reached first is the one that gets cited.',
        evidence: null,
        fix: 'Add <link rel="canonical"> with the absolute preferred URL.',
      }),
    ),
    ...canonicalProblems(page, canonical),
    ...when(page.lang === null || page.lang.trim() === '', () =>
      finding({
        code: 'document.no-lang',
        impact: 'absent',
        area: 'document',
        title: 'The page does not declare its language',
        detail:
          'Without a lang attribute the language has to be detected from the text, and a page detected wrongly is answered from in the wrong language or not at all.',
        evidence: null,
        fix: 'Set lang on the <html> element.',
      }),
    ),
  ];
}

/**
 * A canonical that is relative, or that points at a different host.
 *
 * A cross-host canonical is not always wrong, which is why it is reported
 * rather than assumed broken: syndicated content points home on purpose. What
 * it always means is that this URL asked not to be the one cited.
 */
function canonicalProblems(page: PageDocument, canonical: string | null): CiteFinding[] {
  if (canonical === null) return [];

  let resolved: URL;
  try {
    resolved = new URL(canonical, page.url);
  } catch {
    return [
      finding({
        code: 'document.bad-canonical',
        impact: 'major',
        area: 'document',
        title: 'The canonical URL will not parse',
        detail:
          'The canonical link is not a usable address, so the instruction is dropped and the page is treated as having none.',
        evidence: quote(canonical),
        fix: 'Write the canonical as an absolute https URL.',
      }),
    ];
  }

  const samePage =
    resolved.pathname.replace(/\/+$/, '') === new URL(page.url).pathname.replace(/\/+$/, '');
  const ownDomain = registrableDomain(page.host);
  const targetDomain = registrableDomain(resolved.host);

  /**
   * A canonical to a DIFFERENT page on the same host, graded by TARGET.
   *
   * Pointing a duplicate at its original is what the tag is for, so the bare
   * fact of a mismatch is not a defect: a filtered listing, a sorted one and a
   * `?utm_source` variant all do it correctly. Lighthouse charges one case, and
   * so does this: a canonical at the domain ROOT from a page that is not the
   * root, which is the template hard-coding the home page and consolidating an
   * entire site onto one URL. Anything else is reported and left cheap.
   */
  const atTheRoot = resolved.pathname.replace(/\/+$/, '') === '';

  return [
    ...when(resolved.host === page.host && !samePage, () =>
      finding({
        code: 'document.canonical-mismatch',
        impact: atTheRoot ? 'major' : 'minor',
        area: 'document',
        title: atTheRoot
          ? 'The canonical points at the home page'
          : 'The canonical points at a different page on this site',
        detail: atTheRoot
          ? 'This page tells search engines to credit the home page instead of itself. That is what a template hard-coding one address does, and it consolidates every page carrying it onto a single URL.'
          : 'This page tells search engines to credit another URL instead. That is correct where the page really is a duplicate of that one, and it does mean this address is not the one anything will cite.',
        evidence: quote(`${new URL(page.url).pathname} → ${resolved.pathname}`),
        fix: 'Point the canonical at this page, unless it really is a duplicate of that one.',
      }),
    ),
    /**
     * Another SUBDOMAIN of the same site is ordinary consolidation, not a
     * giveaway. edition.cnn.com canonicalises to www.cnn.com on purpose, and
     * calling that a blocker put a working news front page in the top band.
     * Still worth a line: it means this hostname is not the one cited.
     */
    ...when(resolved.host !== page.host && targetDomain === ownDomain, () =>
      finding({
        code: 'document.canonical-elsewhere',
        impact: 'minor',
        area: 'document',
        title: 'The canonical points at another hostname on this site',
        detail:
          'Everything this address earns is credited to the other hostname. That is how a regional or legacy hostname is meant to consolidate; it does mean this one is not the address anything will cite.',
        evidence: quote(`${page.host} → ${resolved.host}`),
        fix: 'Nothing, if the consolidation is deliberate.',
      }),
    ),
    ...when(targetDomain !== ownDomain, () =>
      finding({
        code: 'document.foreign-canonical',
        impact: 'blocker',
        area: 'document',
        title: 'The page points its canonical at another site',
        detail:
          'This URL declares that a page on a different host is the one to cite. If that is deliberate the content belongs to them; if it is not, every citation this page earns is being handed away.',
        evidence: quote(`${page.host} → ${resolved.host}`),
        fix: 'Point the canonical at this page, unless the content is genuinely published elsewhere first.',
      }),
    ),
  ];
}

/**
 * More than one `rel=canonical`.
 *
 * Google's documented behaviour is to ignore ALL of them when a page declares
 * several, so two tags that each name a sensible URL together achieve exactly
 * what none would. Usually a theme and a plugin both adding one.
 */
export function checkCanonicalCount(page: PageDocument): CiteFinding[] {
  const canonicals = page.links.filter((link) => link.rel.split(/\s+/).includes('canonical'));
  return when(canonicals.length > 1, () =>
    finding({
      code: 'document.multiple-canonical',
      impact: 'major',
      area: 'document',
      title: `The page declares ${canonicals.length} canonical URLs`,
      detail:
        'A page with more than one canonical has none: the instruction is discarded rather than resolved, so the page is treated as having said nothing. Usually two things on the site each adding their own.',
      evidence: quote(canonicals.map((link) => link.href).join(' · ')),
      fix: 'Leave exactly one rel=canonical on the page.',
    }),
  );
}

/**
 * Suffixes where the registrable domain is three labels rather than two.
 *
 * Not the full public suffix list, which is thousands of entries and a
 * dependency this package will not take. A miss reads one label too shallow,
 * which makes the comparison more cautious rather than less: two hosts are
 * called the same site slightly too readily, never a stranger too readily.
 */
const MULTI_LABEL_SUFFIX = new Set([
  'co.uk',
  'org.uk',
  'gov.uk',
  'ac.uk',
  'co.jp',
  'com.au',
  'com.br',
  'co.in',
  'com.cn',
  'co.nz',
  'co.za',
  'com.mx',
]);

/** `edition.cnn.com` and `www.cnn.com` are one site; `medium.com` is not. */
function registrableDomain(host: string): string {
  const labels = host.toLowerCase().split('.');
  if (labels.length <= 2) return labels.join('.');
  const lastTwo = labels.slice(-2).join('.');
  return MULTI_LABEL_SUFFIX.has(lastTwo) ? labels.slice(-3).join('.') : lastTwo;
}
