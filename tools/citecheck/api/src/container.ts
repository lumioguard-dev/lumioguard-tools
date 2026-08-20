import { ReadingRecorder, TargetResolver } from '@lumioguard/api-core';
import { CrawlService } from './services/CrawlService.js';
import { PageFetcher } from './services/PageFetcher.js';
import { ScanService } from './services/ScanService.js';
import { SiteContextReader } from './services/SiteContextReader.js';

export interface Container {
  readonly scanService: ScanService;
  readonly crawlService: CrawlService;
  readonly recorder: ReadingRecorder;
}

/** Composition root. Built once per isolate; the services are stateless. */
let cached: Container | null = null;

export function getContainer(): Container {
  if (cached !== null) return cached;

  const resolver = new TargetResolver();
  const fetcher = new PageFetcher();
  const siteReader = new SiteContextReader(fetcher);

  cached = {
    // Stateless and env-free: the endpoint and the signing key arrive with the
    // request, so they are passed to `record` rather than held here.
    recorder: new ReadingRecorder(),
    scanService: new ScanService({ resolver, fetcher, siteReader }),
    crawlService: new CrawlService({ resolver, fetcher, siteReader }),
  };
  return cached;
}
