import type { PageInput } from '../CiteAnalyzer.js';

/**
 * The crawler's one dependency on the outside world, declared here as a port so
 * `core` still performs no I/O itself. The Worker supplies the adapter.
 */
export interface PageLoader {
  load(url: string): Promise<PageInput>;
}

/** Re-exported so the crawler's neighbours need not know where they live. */
export { CRAWL_DEFAULTS, CRAWL_LIMITS } from '@lumioguard/shared';
