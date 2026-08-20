export {
  finding,
  orderFindings,
  quote,
  when,
  type CiteFinding,
} from './domain/CiteFinding.js';

export { PageDocument } from './read/PageDocument.js';
export type { AnchorRef, HeadingRef, ImageRef, LinkRef } from './read/PageDocument.js';
export { contentRegion, textOf, wordCount } from './read/TagReader.js';

export { KNOWN_AGENTS, type KnownAgent } from './access/agents.js';
export {
  NO_ROBOTS,
  agentPostures,
  allowedForAnyone,
  parseRobots,
  type RobotsTxt,
} from './access/robots.js';
export { parseSitemap, type SitemapRead } from './access/sitemap.js';
export { checkCloaking, type AgentView } from './access/cloaking.js';
export { checkDirectives } from './access/directives.js';
export { readRendering, type RenderingRead } from './access/rendering.js';
export {
  checkCrawlable,
  checkSitemapConflict,
  checkWellKnown,
  type WellKnown,
} from './access/wellKnown.js';

export {
  hasType,
  listField,
  primaryNode,
  readJsonLd,
  stringField,
  typesOf,
  type LdNode,
  type LdRead,
} from './structured/jsonLd.js';
export { checkClaims } from './structured/claims.js';

export { checkCanonicalCount, checkHead } from './document/head.js';
export {
  checkDelivery,
  checkMetaRefresh,
  checkMobile,
  checkTransport,
  type Delivery,
} from './document/delivery.js';
export { checkHreflang } from './document/hreflang.js';
export { checkOutline } from './document/outline.js';
export { checkReferences } from './document/references.js';

export { checkEvidence } from './answer/evidence.js';

export { headlineFor } from './scoring/headline.js';
export { scoreCitation, weightOf, type ScoredCitation } from './scoring/CiteScore.js';

export {
  NO_SITE_CONTEXT,
  analyzePage,
  analyzeSite,
  type PageInput,
  type PageResult,
  type SiteContext,
} from './CiteAnalyzer.js';

export {
  checkBrokenLinks,
  checkDuplicates,
  type BrokenLink,
  type PageIdentity,
} from './crawl/duplicates.js';
export { LinkExtractor } from './crawl/LinkExtractor.js';
export { UrlNormalizer } from './crawl/UrlNormalizer.js';
export { CRAWL_DEFAULTS, CRAWL_LIMITS, type PageLoader } from './crawl/PageLoader.js';
export { SiteCrawler, type CrawlOptions } from './crawl/SiteCrawler.js';
export {
  SiteSummarizer,
  type CrawlError,
  type CrawlSignal,
  type CrawledPage,
  type ReadPage,
  type SiteReport,
  type SiteVerdict,
} from './crawl/SiteSummarizer.js';

export {
  CITATION_BANDS,
  CITATION_MAX,
  CITATION_MIN,
  CitationTier,
  citationBandFor,
  type CitationBand,
} from '@lumioguard/shared';
