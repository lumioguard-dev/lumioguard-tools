import { z } from 'zod';
import { CRAWL_LIMITS } from '../domain/crawl.js';
import { tierSchema } from './finding.js';

export const crawledPageSchema = z.object({
  url: z.string(),
  depth: z.number(),
  score: z.number(),
  tier: tierSchema,
  title: z.string().nullable(),
  signalCount: z.number(),
});

export const siteSignalSchema = z.object({
  id: z.string(),
  label: z.string(),
  weight: z.number(),
  evidence: z.string().nullable(),
  pages: z.number(),
  firstSeen: z.string(),
  onHomepage: z.boolean(),
});

export const siteVerdictSchema = z.object({
  score: z.number(),
  tier: tierSchema,
  tierDescription: z.string(),
  /** See `headline` on a page scan. */
  headline: z.string().nullable(),
  method: z.string(),
  homepageScore: z.number().nullable(),
  medianPageScore: z.number(),
  meanPageScore: z.number(),
  worstPage: z.object({ url: z.string(), score: z.number(), tier: tierSchema }).nullable(),
  hiddenSignals: z.number(),
  hiddenWeight: z.number(),
  hiddenDelta: z.number().nullable(),
  uniqueSignals: z.number(),
});

export const crawlResponseSchema = z.object({
  entry: z.string(),
  pagesScanned: z.number(),
  maxDepthReached: z.number(),
  requestedDepth: z.number(),
  requestedMaxPages: z.number(),
  site: siteVerdictSchema,
  signals: z.array(siteSignalSchema),
  pages: z.array(crawledPageSchema),
  errors: z.array(z.object({ url: z.string(), error: z.string() })),
  screenshotUrl: z.string().nullable(),
  /**
   * The handle this reading was recorded under, for carrying it into
   * LumioGuard. Minted by the recorder, not derived from the address: two
   * people scanning one host are two readings and must not share a key.
   *
   * Null when the reading was not recorded — recording is switched off, or the
   * recorder was unreachable. The report still renders; it simply has no
   * reading to hand on, so the audit link goes to the app's front door.
   */
  siteKey: z.string().nullable(),
  fetchedAt: z.string(),
});

export const crawlRequestSchema = z.object({
  url: z.string({ required_error: 'A URL is required' }).min(1, 'A URL is required'),
  depth: z.coerce.number().int().min(0).max(CRAWL_LIMITS.depth).optional(),
  maxPages: z.coerce.number().int().min(1).max(CRAWL_LIMITS.maxPages).optional(),
});

export type CrawledPageDto = z.infer<typeof crawledPageSchema>;
export type SiteSignalDto = z.infer<typeof siteSignalSchema>;
export type SiteVerdictDto = z.infer<typeof siteVerdictSchema>;
export type CrawlResponse = z.infer<typeof crawlResponseSchema>;
export type CrawlRequest = z.infer<typeof crawlRequestSchema>;
