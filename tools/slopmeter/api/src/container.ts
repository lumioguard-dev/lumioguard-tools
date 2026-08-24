import { ReadingRecorder, TargetResolver } from '@lumioguard/api-core';
import {
  SiteCrawler,
  SlopAnalyzer,
  TierResolver,
  createDefaultRegistry,
} from '@lumioguard/slopmeter-core';
import { ScanResultMapper } from './mappers/ScanResultMapper.js';
import { SiteReportMapper } from './mappers/SiteReportMapper.js';
import { CrawlService } from './services/CrawlService.js';
import { LeaderboardReader } from './services/LeaderboardReader.js';
import { PageFetcher } from './services/PageFetcher.js';
import { ScanService } from './services/ScanService.js';
import { MShotsScreenshotProvider } from './services/ScreenshotProvider.js';
import { SnapshotLoader } from './services/SnapshotLoader.js';

export interface Container {
  readonly scanService: ScanService;
  readonly crawlService: CrawlService;
  readonly recorder: ReadingRecorder;
  readonly leaderboard: LeaderboardReader;
  readonly registry: ReturnType<typeof createDefaultRegistry>;
}

/**
 * Composition root. Built once per isolate: the registry and analyzer are
 * stateless, so rebuilding them per request would re-run rule construction on
 * every scan.
 */
let cached: Container | null = null;

export function getContainer(): Container {
  if (cached !== null) return cached;

  const registry = createDefaultRegistry();
  const tierResolver = new TierResolver();
  const analyzer = new SlopAnalyzer(registry, { tierResolver });
  const resolver = new TargetResolver();
  const fetcher = new PageFetcher();
  const screenshots = new MShotsScreenshotProvider();

  cached = {
    registry,
    // Stateless and env-free: the endpoint and the signing key arrive with the
    // request, so they are passed to `record` rather than held here.
    recorder: new ReadingRecorder(),
    // Env-free for the same reason: the address arrives with the request.
    leaderboard: new LeaderboardReader(),
    scanService: new ScanService({
      resolver,
      fetcher,
      analyzer,
      mapper: new ScanResultMapper(tierResolver, screenshots),
    }),
    crawlService: new CrawlService({
      resolver,
      crawler: new SiteCrawler(analyzer, new SnapshotLoader(fetcher, resolver)),
      mapper: new SiteReportMapper(tierResolver, screenshots),
    }),
  };
  return cached;
}
