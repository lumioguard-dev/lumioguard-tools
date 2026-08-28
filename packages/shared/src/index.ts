export {
  SCORE_MAX,
  SCORE_MIN,
  TIER_BANDS,
  TIER_NAMES,
  Tier,
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
  EXPOSURE_CRITICAL_CEILING,
  EXPOSURE_MAX,
  EXPOSURE_MIN,
  EXPOSURE_TIER_NAMES,
  ExposureTier,
  exposureBandFor,
  type ExposureBand,
  type ExposureTrackSegment,
} from './domain/exposureTier.js';
export {
  CITATION_BANDS,
  CITATION_BLOCKING_CEILING,
  CITATION_MAX,
  CITATION_MIN,
  CITATION_TIER_NAMES,
  CitationTier,
  citationBandFor,
  type CitationBand,
  type CitationTrackSegment,
} from './domain/citationTier.js';
export { CRAWL_DEFAULTS, CRAWL_LIMITS } from './domain/crawl.js';
export {
  EVIDENCE_FLOOR_PAGES,
  READING_CONFIDENCE_NAMES,
  ReadingConfidence,
  confidenceFor,
  confidenceNote,
} from './domain/evidence.js';
export { decodeEntities } from './text/entities.js';
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
  readingConfidenceSchema,
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

export {
  AGENT_ACCESS,
  CITE_AREAS,
  IMPACTS,
  RENDERINGS,
  agentAccessSchema,
  agentPostureSchema,
  citationCountsSchema,
  citationCrawlResponseSchema,
  citationFindingSchema,
  citationRequestSchema,
  citationResponseSchema,
  citationSignalSchema,
  citationSiteVerdictSchema,
  citationSourcesSchema,
  citationTierSchema,
  citeAreaSchema,
  citedPageSchema,
  impactSchema,
  pageProfileSchema,
  renderingSchema,
  type AgentAccess,
  type AgentPostureDto,
  type CitationCountsDto,
  type CitationCrawlResponse,
  type CitationFindingDto,
  type CitationRequest,
  type CitationResponse,
  type CitationSignalDto,
  type CitationSiteVerdictDto,
  type CitationSourcesDto,
  type CiteArea,
  type CitedPageDto,
  type Impact,
  type PageProfileDto,
  type Rendering,
} from './contracts/citation.js';

export { ErrorCode, errorResponseSchema, type ErrorResponse } from './contracts/errors.js';
export {
  READING_BANDS,
  READING_MAX,
  READING_MIN,
  READING_TIER_NAMES,
  ReadingTier,
  consolidatedScore,
  readingBandFor,
  type ReadingBand,
} from './domain/readingTier.js';
// `TrackSegment` is already re-exported by tier.js; one name, one export.
export { bandOf, trackOf, type ScoreBand } from './domain/band.js';
export {
  leaderboardResponseSchema,
  leaderboardRowSchema,
  leaderboardSideSchema,
  type LeaderboardResponse,
  type LeaderboardRow,
  type LeaderboardSide,
} from './contracts/leaderboard.js';
