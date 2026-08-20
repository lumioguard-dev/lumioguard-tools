import { type PageResult, type SiteContext, analyzePage } from '../CiteAnalyzer.js';
import type { CiteFinding } from '../domain/CiteFinding.js';
import { LinkExtractor } from './LinkExtractor.js';
import { CRAWL_DEFAULTS, CRAWL_LIMITS, type PageLoader } from './PageLoader.js';
import { type ReadPage, SiteSummarizer } from './SiteSummarizer.js';
import type { CrawlError, SiteReport } from './SiteSummarizer.js';
import { UrlNormalizer } from './UrlNormalizer.js';

export interface CrawlOptions {
  readonly depth?: number;
  readonly maxPages?: number;
  readonly concurrency?: number;
}

interface Frontier {
  readonly url: string;
  readonly depth: number;
}

/**
 * Walks a site breadth-first AND by depth, reading every page it reaches.
 *
 * The frontier is drained level by level, so `maxPages` buys width across a
 * level and `depth` buys levels. It matters more here than for a homepage
 * audit: the pages worth citing are almost never the front door, and a tool
 * that only reads the root reports on the one page nobody asks a question
 * about.
 */
export class SiteCrawler {
  private readonly loader: PageLoader;
  private readonly links: LinkExtractor;
  private readonly normalizer: UrlNormalizer;
  private readonly summarizer: SiteSummarizer;

  public constructor(
    loader: PageLoader,
    dependencies: {
      links?: LinkExtractor;
      normalizer?: UrlNormalizer;
      summarizer?: SiteSummarizer;
    } = {},
  ) {
    this.loader = loader;
    this.normalizer = dependencies.normalizer ?? new UrlNormalizer();
    this.links = dependencies.links ?? new LinkExtractor(this.normalizer);
    this.summarizer = dependencies.summarizer ?? new SiteSummarizer();
  }

  public async crawl(
    startUrl: string,
    site: SiteContext,
    siteFindings: readonly CiteFinding[],
    options: CrawlOptions = {},
  ): Promise<SiteReport> {
    const depth = Math.max(0, Math.min(CRAWL_LIMITS.depth, options.depth ?? CRAWL_DEFAULTS.depth));
    const maxPages = Math.max(
      1,
      Math.min(CRAWL_LIMITS.maxPages, options.maxPages ?? CRAWL_DEFAULTS.maxPages),
    );
    const concurrency = Math.max(1, options.concurrency ?? CRAWL_DEFAULTS.concurrency);

    const entry = this.normalizer.normalizeToString(startUrl);
    const seen = new Set<string>([entry]);
    /**
     * The addresses actually READ, after redirects.
     *
     * `seen` holds what was queued, which is what was asked for. Two different
     * links can redirect to one page, and tailwindcss.com does exactly that:
     * `/docs` and `/docs/installation` both land on
     * `/docs/installation/using-vite`. Recorded twice, the page became its own
     * duplicate, and the crawl reported two pages sharing a title when there
     * was one page reached two ways.
     */
    const readUrls = new Set<string>();
    const read: ReadPage[] = [];
    const errors: CrawlError[] = [];
    let frontier: Frontier[] = [{ url: entry, depth: 0 }];

    while (frontier.length > 0 && read.length < maxPages) {
      const batch = frontier.splice(0, concurrency);
      const discovered: Frontier[] = [];

      const loaded = await Promise.all(
        batch.map(async (item) => {
          try {
            return { item, input: await this.loader.load(item.url) };
          } catch (error) {
            errors.push({
              url: item.url,
              error: error instanceof Error ? error.message : String(error),
              status: statusOf(error),
            });
            return null;
          }
        }),
      );

      for (const entryResult of loaded) {
        if (entryResult === null) continue;
        if (read.length >= maxPages) break;

        const { item, input } = entryResult;
        const landed = this.normalizer.normalizeToString(input.url);
        if (readUrls.has(landed)) continue;
        readUrls.add(landed);
        seen.add(landed);

        // The crawler-user-agent comparison was made against the ENTRY only, so
        // it is handed to the entry page alone. Attaching it to every page would
        // report one measurement as if it had been taken on all of them.
        const context: SiteContext = item.depth === 0 ? site : { ...site, agentView: null };
        const result: PageResult = analyzePage(input, context);

        read.push({ depth: item.depth, result });

        if (item.depth < depth) {
          for (const link of this.links.extract(input.html, result.url)) {
            if (seen.has(link)) continue;
            seen.add(link);
            discovered.push({ url: link, depth: item.depth + 1 });
          }
        }
      }

      // Breadth-first: finish this level before descending to the next.
      frontier = frontier.concat(discovered);
    }

    return this.summarizer.summarize(entry, read, siteFindings, errors, { depth, maxPages });
  }
}

/**
 * The upstream status off a thrown loader error, where it carries one.
 *
 * Narrowed rather than cast: the port does not name the api's error type, and
 * anything the adapter throws may or may not have reached a server at all.
 */
function statusOf(error: unknown): number | null {
  if (typeof error !== 'object' || error === null || !('status' in error)) return null;
  const { status } = error;
  return typeof status === 'number' ? status : null;
}
