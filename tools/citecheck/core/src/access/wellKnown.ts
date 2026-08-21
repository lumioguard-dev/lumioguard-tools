import type { AgentPostureDto } from '@lumioguard/shared';
import { type CiteFinding, finding, quote, when } from '../domain/CiteFinding.js';
import type { RobotsTxt } from './robots.js';
import type { SitemapRead } from './sitemap.js';

export interface WellKnown {
  readonly robots: RobotsTxt;
  /** The body of `/llms.txt`, or null when nothing was served there. */
  readonly llmsTxt: string | null;
  readonly sitemap: SitemapRead | null;
  readonly postures: readonly AgentPostureDto[];
}

/**
 * What the site's well-known files say, and where two of them disagree.
 *
 * NOTHING HERE SCORES A POSTURE. Blocking an AI crawler is a decision a site is
 * entitled to make, and charging for it would be charging someone for meaning
 * what they said. What is scored is a CONTRADICTION: two files the same site
 * serves, giving opposite instructions, where at most one can be intended.
 */
export function checkWellKnown(input: WellKnown): CiteFinding[] {
  const blocked = input.postures.filter((posture) => posture.access === 'blocked');
  const invitesAgents = input.llmsTxt !== null && input.llmsTxt.trim() !== '';

  return [
    /**
     * A line robots.txt does not understand, after Lighthouse's `robots-txt`.
     *
     * Distinct from the file being absent. A mistyped field is skipped without
     * comment by every crawler that reads it, so the rule its author wrote was
     * never in force and nothing anywhere says so.
     */
    ...when(input.robots.invalidLines.length > 0, () =>
      finding({
        code: 'access.invalid-robots',
        impact: 'major',
        area: 'access',
        title: `robots.txt has ${input.robots.invalidLines.length} ${input.robots.invalidLines.length === 1 ? 'line' : 'lines'} a crawler cannot read`,
        detail:
          'Anything that is not a recognised directive is skipped in silence, so whatever those lines were meant to do is not being done. Nothing reports it back.',
        evidence: quote(input.robots.invalidLines.slice(0, 3).join(' · ')),
        fix: 'Correct the field names; a robots.txt line is `Field: value`.',
      }),
    ),
    ...when(!input.robots.present, () =>
      finding({
        code: 'access.no-robots',
        impact: 'absent',
        area: 'access',
        title: 'No robots.txt is served',
        detail:
          'Nothing is blocked, but nothing is directed either: a crawler has no sitemap to start from, and the site has no place to say which agents it welcomes.',
        evidence: null,
        fix: 'Serve a robots.txt at the site root, naming your sitemap.',
      }),
    ),
    ...when(input.sitemap === null, () =>
      finding({
        code: 'access.no-sitemap',
        impact: 'absent',
        area: 'access',
        title: 'No sitemap was found',
        detail:
          'A crawler reaches only what it can follow a link to. Without a sitemap, any page that is not linked from another page is one nothing will find.',
        evidence: null,
        fix: 'Publish a sitemap.xml and name it in robots.txt with a Sitemap: line.',
      }),
    ),
    ...when(
      input.sitemap !== null && input.robots.present && input.robots.sitemaps.length === 0,
      () =>
        finding({
          code: 'access.sitemap-unlisted',
          impact: 'minor',
          area: 'access',
          title: 'The sitemap is served but robots.txt does not name it',
          detail:
            'Crawlers that guess at /sitemap.xml will find it; the ones that read robots.txt first will not look. Naming it costs one line.',
          evidence: input.sitemap === null ? null : quote(input.sitemap.url),
          fix: 'Add a Sitemap: line to robots.txt pointing at the absolute sitemap URL.',
        }),
    ),
    /**
     * The contradiction, not the posture: a file inviting AI readers beside a
     * file turning them away. One of the two is out of date.
     *
     * It takes MOST of them, not one. notion.com publishes an llms.txt and
     * blocks two agents of fourteen, allowing OpenAI, Anthropic and Perplexity
     * while refusing Meta and Amazon. That is a considered policy, and calling
     * it a contradiction charged them for having made a decision.
     */
    ...when(invitesAgents && blocked.length > input.postures.length / 2, () =>
      finding({
        code: 'access.llms-contradiction',
        impact: 'major',
        area: 'access',
        title: 'llms.txt invites AI readers that robots.txt turns away',
        detail:
          'The site publishes a guide written for AI agents and separately tells most of those agents not to fetch anything. Whichever file is right, the other is stale.',
        evidence: quote(
          `${blocked.length} of ${input.postures.length} blocked in robots.txt: ${blocked
            .map((p) => p.agent)
            .join(', ')}`,
        ),
        fix: 'Decide which agents you want, then make robots.txt and llms.txt agree.',
      }),
    ),
    // Never asked of a sitemap INDEX. An index lists further sitemaps, not
    // pages, so "this URL is not among its entries" is true of every page on
    // the site and means nothing. Reported against stripe.com's index of nine
    // child sitemaps, which is exactly the kind of confident false finding that
    // costs a report its credibility.
    ...when(
      input.sitemap?.listsTarget === false && !input.sitemap.isIndex && input.sitemap.urlCount > 0,
      () =>
        finding({
          code: 'access.sitemap-omits-page',
          impact: 'minor',
          area: 'access',
          title: 'This page is not in the sitemap',
          detail:
            'The site publishes a sitemap and this URL is not among its entries, so a crawler working from the sitemap alone never learns the page exists.',
          evidence:
            input.sitemap === null
              ? null
              : quote(`${input.sitemap.urlCount} URLs listed, none matching this one`),
          fix: 'Add the page to the sitemap, or remove it if it is not meant to be found.',
        }),
    ),
  ];
}

/**
 * A page robots.txt tells every crawler to leave alone.
 *
 * Half of Lighthouse's `is-crawlable`, the audit it weights above every other
 * in its SEO score, and the half this engine did not have: the directive was
 * computed and used only to decide whether the SITEMAP contradicted it, so a
 * page simply disallowed and not listed anywhere was never reported at all.
 *
 * A blocker on its own. Whatever else is true of the page, nothing is coming to
 * read it.
 */
export function checkCrawlable(disallowedForAll: boolean, path: string): CiteFinding[] {
  return when(disallowedForAll, () =>
    finding({
      code: 'access.disallowed',
      impact: 'blocker',
      area: 'access',
      title: 'robots.txt tells every crawler to leave this page alone',
      detail:
        'The site refuses this path to crawlers generally, not just to one of them. A search engine that honours it never fetches the page, so nothing else on this reading can matter while it stands.',
      evidence: quote(`Disallow matches ${path}`),
      fix: 'Remove the Disallow rule covering this path, if it was not meant to cover it.',
    }),
  );
}

/**
 * A page disallowed by the same site that lists it in its sitemap.
 *
 * Separate from the checks above because it needs the posture of a general
 * crawler rather than the AI-specific ones, and because it is the sharpest
 * contradiction a site can serve: one file asking to be crawled, another
 * refusing.
 */
export function checkSitemapConflict(
  sitemap: SitemapRead | null,
  disallowedForAll: boolean,
): CiteFinding[] {
  return when(sitemap?.listsTarget === true && disallowedForAll, () =>
    finding({
      code: 'access.sitemap-conflict',
      impact: 'major',
      area: 'access',
      title: 'The sitemap offers a page robots.txt refuses',
      detail:
        'This URL is listed for crawling and disallowed for crawling by the same site. A crawler obeys the refusal, so the sitemap entry does nothing except hide the problem.',
      evidence: sitemap === null ? null : quote(`listed in ${sitemap.url}, disallowed for *`),
      fix: 'Remove the Disallow rule covering this path, or drop the page from the sitemap.',
    }),
  );
}
