export {
  SCORE_MAX,
  SCORE_MIN,
  TIER_BANDS,
  TIER_NAMES,
  Tier,
  bandTrack,
  type TierBand,
  type TrackSegment,
} from './domain/tier.js';

export {
  hostOf,
  parseAddress,
  type AddressResult,
  type ParsedAddress,
} from './domain/address.js';

export {
  EXPOSURE_BANDS,
  EXPOSURE_CRITICAL_FLOOR,
  EXPOSURE_MAX,
  EXPOSURE_MIN,
  EXPOSURE_TIER_NAMES,
  ExposureTier,
  exposureBandFor,
  exposureBandTrack,
  type ExposureBand,
  type ExposureTrackSegment,
} from './domain/exposureTier.js';
export { CRAWL_DEFAULTS, CRAWL_LIMITS } from './domain/crawl.js';
export { SCREENSHOT_WIDTH, mshotsUrl } from './domain/screenshot.js';
export { SITE_KEY_LENGTH, SITE_KEY_PATTERN, newSiteKey } from './domain/siteKey.js';

export {
  findingSchema,
  scoreBreakdownSchema,
  tierSchema,
  type FindingDto,
  type ScoreBreakdownDto,
} from './contracts/finding.js';

export {
  analyzeRequestSchema,
  scanRequestSchema,
  scanResponseSchema,
  type AnalyzeRequest,
  type ScanRequest,
  type ScanResponse,
} from './contracts/scan.js';

export {
  crawlRequestSchema,
  crawlResponseSchema,
  crawledPageSchema,
  siteSignalSchema,
  siteVerdictSchema,
  type CrawlRequest,
  type CrawlResponse,
  type CrawledPageDto,
  type SiteSignalDto,
  type SiteVerdictDto,
} from './contracts/crawl.js';

export {
  CATEGORIES,
  SEVERITIES,
  categorySchema,
  detectedStackSchema,
  exposureFindingSchema,
  exposureRequestSchema,
  exposureResponseSchema,
  exposureTierSchema,
  severitySchema,
  type DetectedStackDto,
  type ExposureCategory,
  type ExposureFindingDto,
  type ExposureRequest,
  type ExposureResponse,
  type Severity,
} from './contracts/exposure.js';

export { ErrorCode, errorResponseSchema, type ErrorResponse } from './contracts/errors.js';
