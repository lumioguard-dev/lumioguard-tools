import {
  type AgentView,
  NO_ROBOTS,
  PageDocument,
  type RobotsTxt,
  type SiteContext,
  type SitemapRead,
  agentPostures,
  allowedForAnyone,
  parseRobots,
  parseSitemap,
} from '@lumioguard/citecheck-core';
import type { CitationSourcesDto } from '@lumioguard/shared';
import type { AgentProbe, PageFetcher } from './PageFetcher.js';

/** Where a sitemap is looked for when robots.txt does not name one. */
const DEFAULT_SITEMAP_PATH = '/sitemap.xml';

/** How many of the sitemaps robots.txt names are tried before giving up. */
const MAX_SITEMAP_TRIES = 3;

/**
 * The fetches that describe a SITE rather than a page: robots.txt, the sitemap,
 * llms.txt, and the one crawler-identity request.
 *
 * Four extra GETs per reading, and that ceiling is the whole budget: it is
 * stated here as the list it is, so a number in the README or in the UI can be
 * derived from this rather than typed beside it.
 */
export interface SiteRead {
  readonly context: SiteContext;
  readonly sources: CitationSourcesDto;
}

export class SiteContextReader {
  private readonly fetcher: PageFetcher;

  public constructor(fetcher: PageFetcher) {
    this.fetcher = fetcher;
  }

  public async read(target: URL, probe: AgentProbe | null, finalUrl?: string): Promise<SiteRead> {
    const origin = new URL(target.toString()).origin;

    const [robotsBody, llmsTxt] = await Promise.all([
      this.fetcher.fetchText(`${origin}/robots.txt`),
      this.fetcher.fetchText(`${origin}/llms.txt`),
    ]);

    // A body that is an HTML page is a site answering 200 with its shell for an
    // unknown path. Treated as absent: reading it as robots.txt finds no
    // directives and would report the site as having a permissive one.
    const robots: RobotsTxt =
      robotsBody === null || looksLikeHtml(robotsBody) ? NO_ROBOTS : parseRobots(robotsBody);

    // Compared against where the page actually LANDED: apple.com resolves to
    // www.apple.com, and a sitemap listing the final address does not list the
    // address that was asked for.
    const sitemap = await this.readSitemap(robots, origin, finalUrl ?? target.toString());
    const path = `${target.pathname}${target.search}`;

    return {
      context: {
        wellKnown: {
          robots,
          llmsTxt: looksLikeHtml(llmsTxt) ? null : llmsTxt,
          sitemap,
          postures: agentPostures(robots, path),
        },
        disallowedForAll: !allowedForAnyone(robots, path),
        agentView: viewOf(probe),
      },
      sources: {
        robotsTxt: robots.present,
        sitemap: sitemap !== null,
        llmsTxt: llmsTxt !== null && !looksLikeHtml(llmsTxt),
        agentFetch: probe !== null,
      },
    };
  }

  /**
   * The first sitemap robots.txt names that actually answers, else the
   * conventional path.
   *
   * EACH candidate in turn, not only the first. apple.com names five, and its
   * CDN refuses the first of them to this reader, so a site publishing five
   * sitemaps was reported as having none at all. Capped, because bbc.com names
   * thirty-five and a reading is not a sitemap crawl.
   */
  private async readSitemap(
    robots: RobotsTxt,
    origin: string,
    target: string,
  ): Promise<SitemapRead | null> {
    const candidates = [
      ...robots.sitemaps.slice(0, MAX_SITEMAP_TRIES),
      `${origin}${DEFAULT_SITEMAP_PATH}`,
    ];

    for (const candidate of candidates) {
      const body = await this.fetcher.fetchText(candidate);
      if (body === null || !/<(?:urlset|sitemapindex)\b/i.test(body)) continue;
      return parseSitemap(body, candidate, target);
    }
    return null;
  }
}

/**
 * A crawler's own view, measured the same way the browser's was.
 *
 * The word count is taken through `PageDocument` rather than from the raw
 * length, so the two sides of the comparison are counted identically. Comparing
 * bytes against words made a minified page look like a stripped one.
 */
function viewOf(probe: AgentProbe | null): AgentView | null {
  if (probe === null) return null;
  const contentWordCount =
    probe.html === ''
      ? 0
      : PageDocument.read({ url: 'https://example.invalid/', html: probe.html }).contentWordCount;
  return { status: probe.status, contentWordCount, userAgent: probe.userAgent };
}

function looksLikeHtml(body: string | null): boolean {
  return body !== null && /^\s*(?:<!doctype html|<html\b)/i.test(body);
}
