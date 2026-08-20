import { type CiteFinding, finding, quote, when } from '../domain/CiteFinding.js';
import type { AnchorRef, PageDocument } from '../read/PageDocument.js';

/**
 * Anchor text that describes nothing, taken FROM LIGHTHOUSE.
 *
 * Lifted from its `link-text` audit rather than invented here, so the bar is
 * one a site owner can check against a second tool. The list this replaced was
 * written from intuition and reported stripe.com for an anchor reading "Link",
 * which is the name of their product; Lighthouse does not treat that word as
 * non-descriptive in English either.
 *
 * Matched against the WHOLE trimmed text, so a link reading "more" fails and
 * one reading "more about pricing" does not.
 */
const NON_DESCRIPTIVE = new Set([
  'click here',
  'click this',
  'go',
  'here',
  'information',
  'learn more',
  'more',
  'more info',
  'more information',
  'right here',
  'read more',
  'see more',
  'start',
  'this',
]);

/** Lighthouse skips these before judging the text, and so does this. */
function judged(anchor: AnchorRef, base: string): boolean {
  const href = anchor.href;
  if (href === null || href.trim() === '') return false;
  if (/^(?:mailto|tel|javascript):/i.test(href)) return false;
  if (/\brel\s*=\s*["']?[^"'>]*\bnofollow\b/i.test(anchor.attrs)) return false;
  if (href.startsWith('#')) return false;

  // A link to this same page is navigation, not a description of somewhere else.
  try {
    const target = new URL(href, base);
    const here = new URL(base);
    return !(target.host === here.host && target.pathname === here.pathname);
  } catch {
    return false;
  }
}

/** Above this share of a page's links, script navigation is how the page works. */
const UNCRAWLABLE_SHARE = 0.2;

/** `javascript:void(0)` and its punctuation variants, as Lighthouse matches them. */
const JAVASCRIPT_VOID = /^javascript:\s*void\s*\(?\s*0\s*\)?/i;

/** How the page connects to the rest of the site, and how it describes it. */
export function checkReferences(page: PageDocument): CiteFinding[] {
  const linked = page.anchors.filter(
    (anchor) => anchor.href !== null && anchor.href.trim() !== '' && !anchor.href.startsWith('#'),
  );

  let internal = 0;
  let external = 0;
  for (const anchor of linked) {
    try {
      if (new URL(anchor.href ?? '', page.url).host === page.host) internal += 1;
      else external += 1;
    } catch {
      // An href that will not resolve links nowhere; it counts as neither.
    }
  }

  /**
   * Counted by TARGET, not by element. The same "Read more" rendered twice
   * against one href is one uninformative link, and counting both took
   * stripe.com to the threshold on the strength of a single anchor.
   */
  const vagueTargets = new Map<string, string>();
  for (const anchor of page.anchors) {
    if (!judged(anchor, page.url)) continue;
    const text = anchor.text
      .trim()
      .toLowerCase()
      .replace(/[.!→>»]+$/, '')
      .trim();
    if (NON_DESCRIPTIVE.has(text)) vagueTargets.set(anchor.href ?? '', anchor.text.trim());
  }
  const vague = [...vagueTargets.values()];

  const described = page.images.filter((image) => image.alt !== null);
  const missingAlt = page.images.length - described.length;

  return [
    ...when(internal === 0 && linked.length > 0, () =>
      finding({
        code: 'document.orphan',
        impact: 'minor',
        area: 'document',
        title: 'The page links nowhere else on this site',
        detail:
          'Every link here leaves. A crawler arriving on this page learns about no other page from it, and the page itself looks like a leaf with nothing depending on it.',
        evidence: quote(`${external} external links, no internal ones`),
        fix: 'Link to the related pages on your own site.',
      }),
    ),
    ...when(linked.length === 0, () =>
      finding({
        code: 'document.no-links',
        impact: 'minor',
        area: 'document',
        title: 'The page has no links at all',
        detail:
          'Nothing leads anywhere from here, so this is where a crawl of the site stops. It is also a page with no corroboration: nothing it says points at anything supporting it.',
        evidence: null,
        fix: 'Link to the pages this one relates to, and to your sources.',
      }),
    ),
    ...when(vague.length > 0, () =>
      finding({
        code: 'document.vague-anchors',
        impact: 'minor',
        area: 'document',
        title: `${vague.length} ${vague.length === 1 ? 'link says' : 'links say'} nothing about where it goes`,
        detail:
          'Anchor text is how a page describes what it points at, and one of the few descriptions of a page written by somebody other than that page. "Read more" describes nothing, so the relationship between the two is lost.',
        evidence: quote(vague.slice(0, 4).join(' · ')),
        fix: 'Replace the anchor text with the name of the thing being linked to.',
      }),
    ),
    ...checkCrawlableAnchors(page),
    /**
     * ANY image without an alt, which is where Lighthouse draws it. This used
     * to need half of them missing before it said anything, so a page with ten
     * undescribed images among a hundred passed in silence.
     */
    ...when(missingAlt > 0, () =>
      finding({
        code: 'document.missing-alt',
        impact: 'minor',
        area: 'document',
        title: `${missingAlt} of ${page.images.length} images have no alt attribute`,
        detail:
          'An image with no alt is content a reader that cannot see it never receives, and that includes every engine reading the page. A decorative image is marked with an empty alt, which counts as answered.',
        evidence: quote(page.images.find((image) => image.alt === null)?.src ?? ''),
        fix: 'Describe each image in its alt, or set alt="" if it is purely decorative.',
      }),
    ),
  ];
}

/**
 * Anchors a crawler cannot follow, after Lighthouse's `crawlable-anchors`.
 *
 * A link that navigates by script is a link no crawler ever sees, so whatever
 * it points at is reachable only by a visitor who runs JavaScript. Only the
 * statically provable cases are reported: an `href` absent beside an event
 * handler, an empty one, `javascript:void(0)`, or one that will not parse.
 * Lighthouse also inspects listeners attached at runtime, which nothing reading
 * served markup can see, and those are left alone rather than guessed at.
 */
function checkCrawlableAnchors(page: PageDocument): CiteFinding[] {
  const uncrawlable = page.anchors.filter((anchor) => {
    const href = anchor.href;
    if (href === null) return /\bon[a-z]+\s*=/i.test(anchor.attrs);
    if (href.trim() === '') return true;
    if (JAVASCRIPT_VOID.test(href.trim())) return true;
    try {
      new URL(href, page.url);
      return false;
    } catch {
      return true;
    }
  });

  /**
   * Graded by SHARE, because this score is additive where Lighthouse's is
   * pass/fail. It fails the audit on a single bad anchor, which is right for a
   * pass/fail result and wrong for points: microsoft.com's skip link is one
   * uncrawlable anchor among about a hundred, and it cannot weigh the same as a
   * page whose navigation is entirely script.
   */
  const share = uncrawlable.length / Math.max(1, page.anchors.length);
  const mostOfThem = uncrawlable.length >= 3 && share >= UNCRAWLABLE_SHARE;

  return when(uncrawlable.length > 0, () =>
    finding({
      code: 'document.uncrawlable-anchors',
      impact: mostOfThem ? 'major' : 'minor',
      area: 'document',
      title: `${uncrawlable.length} ${uncrawlable.length === 1 ? 'link is' : 'links are'} not crawlable`,
      detail:
        'These navigate by script rather than by address, so a crawler never follows them. Whatever they lead to is reachable only by a visitor whose browser runs the page.',
      evidence: quote(
        uncrawlable
          .slice(0, 3)
          .map((anchor) => anchor.text.trim() || `<a ${anchor.attrs.trim().slice(0, 40)}>`)
          .join(' · '),
      ),
      fix: 'Give each one a real href; keep the script handler beside it if you need it.',
    }),
  );
}
