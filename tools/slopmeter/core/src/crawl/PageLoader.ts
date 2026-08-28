import type { PageSnapshot } from '../domain/PageSnapshot.js';

/**
 * The crawler's one dependency on the outside world, declared here as a port so
 * `core` still performs no I/O itself. The Worker supplies the adapter.
 */
export interface PageLoader {
  /** `isEntry` lets an adapter fetch stylesheets for the entry page only. */
  load(url: string, isEntry: boolean): Promise<PageSnapshot>;
}

export { CRAWL_DEFAULTS, CRAWL_LIMITS } from '@lumioguard/shared';
