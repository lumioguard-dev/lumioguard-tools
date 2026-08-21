import { type CiteFinding, finding, quote } from '../domain/CiteFinding.js';

/** One page's identity fields, as the crawl saw them. */
export interface PageIdentity {
  readonly url: string;
  readonly title: string | null;
  readonly description: string | null;
}

/** Below this many pages sharing a value, it is a pair and not a pattern. */
const DUPLICATE_THRESHOLD = 2;

/** How many of the offending URLs to name before the evidence stops helping. */
const NAMED = 3;

function groupBy(
  pages: readonly PageIdentity[],
  read: (page: PageIdentity) => string | null,
): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const page of pages) {
    const value = read(page)?.trim();
    if (value === undefined || value === '') continue;
    const key = value.toLowerCase();
    const urls = groups.get(key) ?? [];
    urls.push(page.url);
    groups.set(key, urls);
  }
  return groups;
}

function pathsOf(urls: readonly string[]): string {
  return urls
    .slice(0, NAMED)
    .map((url) => {
      try {
        return new URL(url).pathname;
      } catch {
        return url;
      }
    })
    .join(' · ');
}

function repeated(
  pages: readonly PageIdentity[],
  read: (page: PageIdentity) => string | null,
): Array<[string, string[]]> {
  return [...groupBy(pages, read).entries()]
    .filter(([, urls]) => urls.length >= DUPLICATE_THRESHOLD)
    .sort((a, b) => b[1].length - a[1].length);
}

/**
 * The same title or description on more than one page.
 *
 * THE flagship finding of every crawl-based search audit, and one no
 * single-page tool can produce. Two pages sharing a title are two pages
 * competing for one query with half the evidence each, and a template emitting
 * one title for a whole section does it silently: every page looks correct on
 * its own, and only reading them together shows it.
 *
 * SEARCH ONLY. Sharing a title costs a page nothing in being read or quoted;
 * what it costs is the ranking signal split between them.
 */
export function checkDuplicates(pages: readonly PageIdentity[]): CiteFinding[] {
  if (pages.length < DUPLICATE_THRESHOLD) return [];

  const findings: CiteFinding[] = [];

  const titles = repeated(pages, (page) => page.title);
  const worstTitle = titles[0];
  if (worstTitle !== undefined) {
    const affected = titles.reduce((sum, [, urls]) => sum + urls.length, 0);
    findings.push(
      finding({
        code: 'document.duplicate-title',
        impact: 'major',
        area: 'document',
        title: `${affected} pages share a title with another page`,
        detail:
          'Pages with the same title compete with each other for one query, and a search engine picks one of them to show. Where a template emits a single title for a whole section, every page in it looks correct on its own.',
        evidence: quote(`"${worstTitle[0]}" on ${worstTitle[1].length}: ${pathsOf(worstTitle[1])}`),
        fix: 'Give each page a title naming what is on that page.',
      }),
    );
  }

  const descriptions = repeated(pages, (page) => page.description);
  const worstDescription = descriptions[0];
  if (worstDescription !== undefined) {
    const affected = descriptions.reduce((sum, [, urls]) => sum + urls.length, 0);
    findings.push(
      finding({
        code: 'document.duplicate-description',
        impact: 'minor',
        area: 'document',
        title: `${affected} pages share a meta description with another page`,
        detail:
          'A description repeated across pages describes none of them. Where it is shown at all it says the same thing about every result, which is the one job it had.',
        evidence: quote(
          `"${worstDescription[0].slice(0, 50)}" on ${worstDescription[1].length}: ${pathsOf(
            worstDescription[1],
          )}`,
        ),
        fix: 'Write a description per page, or leave it out and let the engine choose.',
      }),
    );
  }

  return findings;
}

/** An internal link the crawl followed and could not load. */
export interface BrokenLink {
  readonly url: string;
  readonly error: string;
  readonly status: number | null;
}

/**
 * Statuses that mean REFUSED, not missing.
 *
 * A bot filter turning the reader away is not a broken link, and conflating
 * them reported apple.com as having ten internal links leading nowhere. Every
 * one of those pages loads perfectly; Apple answers 403 to a crawler it does
 * not recognise. What that is worth saying about lives in the access checks,
 * which measure it against a real crawler token rather than ours.
 */
const REFUSED = new Set([401, 403, 429]);

/**
 * Links the site makes to itself that do not load.
 *
 * Reported against the SITE rather than the page carrying them, because a crawl
 * reaches one broken URL once however many pages point at it. A search finding:
 * a dead internal link spends crawl budget on a dead end and takes a visitor to
 * one, and nothing on the linking page shows that it is broken.
 */
export function checkBrokenLinks(errors: readonly BrokenLink[]): CiteFinding[] {
  const broken = errors.filter((item) => item.status === null || !REFUSED.has(item.status));
  if (broken.length === 0) return [];
  return [
    finding({
      code: 'document.broken-links',
      impact: 'minor',
      area: 'document',
      title: `${broken.length} internal ${broken.length === 1 ? 'link leads' : 'links lead'} nowhere`,
      detail:
        'A link the site makes to itself that will not load spends crawl budget on a dead end and takes a visitor to one. Nothing on the page carrying it shows that it is broken.',
      evidence: quote(pathsOf(broken.map((item) => item.url))),
      fix: 'Fix or remove them; the addresses are listed with the pages read.',
    }),
  ];
}
