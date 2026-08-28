export { PageContextFactory } from './analysis/PageContextFactory.js';
export type { PageContext } from './analysis/PageContext.js';
export { HtmlDocument } from './analysis/HtmlDocument.js';
export { StyleSheets } from './analysis/StyleSheets.js';
export { TextContent } from './analysis/TextContent.js';
export { AnalysisLimits } from './analysis/Limits.js';

export { Finding } from './domain/Finding.js';
export { PageSnapshot } from './domain/PageSnapshot.js';
export { RuleCategory, type RuleCategoryValue } from './domain/RuleCategory.js';
export { ScanResult, type AssessmentCaveats } from './domain/ScanResult.js';
export { Score } from './domain/Score.js';
export { ScoreAxis, type ScoreAxisValue } from './domain/ScoreAxis.js';
export { SCORE_MAX, SCORE_MIN, TIER_BANDS, Tier, type TierBand } from '@lumioguard/shared';

export { AxisPolicy } from './rules/AxisPolicy.js';
export { defineRule, PredicateRule, Rule, type RuleSpec } from './rules/Rule.js';
export { RuleRegistry, type RuleFilter } from './rules/RuleRegistry.js';
export { createDefaultRegistry } from './rules/definitions/index.js';

export { headlineFor, headlineFrom, type Tellable } from './scoring/Headline.js';
export { ScoreCalculator } from './scoring/ScoreCalculator.js';
export { TierResolver } from './scoring/TierResolver.js';

export { SlopAnalyzer, type AnalyzeOptions } from './SlopAnalyzer.js';

export { LinkExtractor } from './crawl/LinkExtractor.js';
export { CRAWL_DEFAULTS, CRAWL_LIMITS, type PageLoader } from './crawl/PageLoader.js';
export { SiteCrawler, type CrawlOptions } from './crawl/SiteCrawler.js';
export { SiteSummarizer, type ScoredPage } from './crawl/SiteSummarizer.js';
export { UrlNormalizer } from './crawl/UrlNormalizer.js';
export {
  SiteReport,
  type CrawledPage,
  type CrawlError,
  type SiteSignal,
  type SiteVerdict,
} from './domain/SiteReport.js';
