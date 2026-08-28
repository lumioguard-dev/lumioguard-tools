import type { AnalyzeOptions, SlopAnalyzer } from '../SlopAnalyzer.js';
import type { CrawlError, SiteReport } from '../domain/SiteReport.js';
import { LinkExtractor } from './LinkExtractor.js';
import { CRAWL_DEFAULTS, CRAWL_LIMITS, type PageLoader } from './PageLoader.js';
import { type ScoredPage, SiteSummarizer } from './SiteSummarizer.js';
import { UrlNormalizer } from './UrlNormalizer.js';

export interface CrawlOptions extends AnalyzeOptions {
  readonly depth?: number;
  readonly maxPages?: number;
  readonly concurrency?: number;
}

interface Frontier {
  readonly url: string;
  readonly depth: number;
}

/**
 * Walks a site breadth-first AND by depth: the frontier drains level by level,
 * so `maxPages` buys width across a level and `depth` buys levels. Scanning only
 * a domain root sees nothing one click deep, which is where unfinished pages live.
 */
export class SiteCrawler {
  private readonly analyzer: SlopAnalyzer;
  private readonly loader: PageLoader;
  private readonly links: LinkExtractor;
  private readonly normalizer: UrlNormalizer;
  private readonly summarizer: SiteSummarizer;

  public constructor(
    analyzer: SlopAnalyzer,
    loader: PageLoader,
    dependencies: {
      links?: LinkExtractor;
      normalizer?: UrlNormalizer;
      summarizer?: SiteSummarizer;
    } = {},
  ) {
    this.analyzer = analyzer;
    this.loader = loader;
    this.normalizer = dependencies.normalizer ?? new UrlNormalizer();
    this.links = dependencies.links ?? new LinkExtractor(this.normalizer);
    this.summarizer = dependencies.summarizer ?? new SiteSummarizer();
  }

  public async crawl(startUrl: string, options: CrawlOptions = {}): Promise<SiteReport> {
    const depth = Math.max(0, Math.min(CRAWL_LIMITS.depth, options.depth ?? CRAWL_DEFAULTS.depth));
    const maxPages = Math.max(
      1,
      Math.min(CRAWL_LIMITS.maxPages, options.maxPages ?? CRAWL_DEFAULTS.maxPages),
    );
    const concurrency = Math.max(1, options.concurrency ?? CRAWL_DEFAULTS.concurrency);

    const entry = this.normalizer.normalizeToString(startUrl);
    const seen = new Set<string>([entry]);
    const scored: ScoredPage[] = [];
    const errors: CrawlError[] = [];
    let frontier: Frontier[] = [{ url: entry, depth: 0 }];

    while (frontier.length > 0 && scored.length < maxPages) {
      const batch = frontier.splice(0, concurrency);
      const discovered: Frontier[] = [];

      const loaded = await Promise.all(
        batch.map(async (item) => {
          try {
            return { item, snapshot: await this.loader.load(item.url, item.depth === 0) };
          } catch (error) {
            errors.push({
              url: item.url,
              error: error instanceof Error ? error.message : String(error),
            });
            return null;
          }
        }),
      );

      for (const entryResult of loaded) {
        if (entryResult === null) continue;
        if (scored.length >= maxPages) break;

        const { item, snapshot } = entryResult;
        const result = this.analyzer.analyze(snapshot, options);
        const url = snapshot.url ?? item.url;

        scored.push({
          page: {
            url,
            depth: item.depth,
            score: result.score.value,
            tier: result.tier,
            title: result.title,
            signalCount: result.findings.filter((f) => f.weight > 0).length,
          },
          findings: result.findings,
        });

        if (item.depth < depth) {
          for (const link of this.links.extract(snapshot.html, url)) {
            if (seen.has(link)) continue;
            seen.add(link);
            discovered.push({ url: link, depth: item.depth + 1 });
          }
        }
      }

      // Breadth-first: finish this level before descending to the next.
      frontier = frontier.concat(discovered);
    }

    return this.summarizer.summarize(entry, scored, errors, { depth, maxPages });
  }
}
