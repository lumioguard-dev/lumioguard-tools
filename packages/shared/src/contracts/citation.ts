import { z } from 'zod';
import { CITATION_TIER_NAMES } from '../domain/citationTier.js';
import { enumOf } from './zod.js';

export const citationTierSchema = enumOf(CITATION_TIER_NAMES);

/**
 * Ordered worst-first, the order a report lists findings in. `absent` is NOT a
 * fourth severity: it flags a signal the page does not publish and weighs
 * nothing. Absence is a choice, and only a BROKEN one is a defect.
 */
export const IMPACTS = ['blocker', 'major', 'minor', 'absent'] as const;
export const impactSchema = enumOf(IMPACTS);
export type Impact = (typeof IMPACTS)[number];

/**
 * The four questions a reading asks, in the order it asks them. An area groups
 * the report and chooses the copy around a finding; it never carries the
 * detector's internal code (see finding.ts for why).
 */
export const CITE_AREAS = ['access', 'structured', 'document', 'answerability'] as const;
export const citeAreaSchema = enumOf(CITE_AREAS);
export type CiteArea = (typeof CITE_AREAS)[number];

/**
 * One thing standing between this page and being quoted, as the visitor is
 * shown it. No `fix` on the wire, deliberately: the remediation is the reason
 * to continue into LumioGuard.
 *
 * `evidence` is what the page actually served, quoted back. A page's own markup
 * is already public to anyone with the URL, so unlike an exposure report there
 * is nothing here to redact; what it must not do is paraphrase, because a
 * finding the author cannot locate in their own source is a finding they cannot
 * act on.
 */
export const citationFindingSchema = z.object({
  /** Opaque and valid only within this response; exists so a list can be keyed. */
  id: z.string(),
  impact: impactSchema,
  /** What this finding cost the score. Lets a multi-tool surface rank across tools. */
  weight: z.number(),
  area: citeAreaSchema,
  title: z.string(),
  detail: z.string(),
  evidence: z.string().nullable(),
});

export const AGENT_ACCESS = ['allowed', 'blocked', 'unmentioned'] as const;
export const agentAccessSchema = enumOf(AGENT_ACCESS);
export type AgentAccess = (typeof AGENT_ACCESS)[number];

/**
 * What `robots.txt` says to one named crawler. REPORTED, NEVER SCORED.
 *
 * Blocking an AI crawler is a decision, not a defect: plenty of sites mean it.
 * Scoring it would charge people for a choice they made on purpose, which is
 * the false positive that costs a report its credibility. What is scored is a
 * CONTRADICTION between two things the site says, never the posture itself.
 *
 * `unmentioned` is its own answer and not a synonym for allowed: nothing in
 * robots.txt applies to this agent at all, so it may read by default, but the
 * site never said so and the next edit could change that silently.
 */
export const agentPostureSchema = z.object({
  /** The token as robots.txt spells it. */
  agent: z.string(),
  /** Who runs it, for a reader who does not recognise the token. */
  operator: z.string(),
  access: agentAccessSchema,
  /** The group that decided it, e.g. `User-agent: *`. Null when nothing matched. */
  rule: z.string().nullable(),
});

/**
 * How the page's own text reached the reader.
 *
 * `shell` is the finding that matters and the reason this field exists: the
 * served HTML carried no prose, so every crawler that does not run JavaScript
 * sees an empty document. `hydrated` means the prose was there AND a framework
 * also runs, which is fine.
 */
export const RENDERINGS = ['served', 'hydrated', 'shell'] as const;
export const renderingSchema = enumOf(RENDERINGS);
export type Rendering = (typeof RENDERINGS)[number];

/** What the page says it is. Reported, never scored. */
export const pageProfileSchema = z.object({
  rendering: renderingSchema,
  /** The `@type` its JSON-LD claims; null when it claims none. */
  declaredType: z.string().nullable(),
  /** From `<meta name="generator">`, verbatim. Null when absent. */
  generator: z.string().nullable(),
});

/**
 * What this reading actually read. False means "not fetched", never "fetched
 * and clean" -- so the report can say it found no sitemap rather than implying
 * it checked one and it was fine.
 */
export const citationSourcesSchema = z.object({
  robotsTxt: z.boolean(),
  sitemap: z.boolean(),
  llmsTxt: z.boolean(),
  /** Whether the second fetch, as a crawler, ran and could be compared. */
  agentFetch: z.boolean(),
});

export const citationCountsSchema = z.object({
  blocker: z.number(),
  major: z.number(),
  minor: z.number(),
  /** Unscored, so it is counted apart from the three that are. */
  absent: z.number(),
});

export const citationResponseSchema = z.object({
  url: z.string(),
  host: z.string(),
  title: z.string().nullable(),
  /** 0-100, HIGHER IS BETTER. 100 is a page with nothing in its way. */
  score: z.number(),
  tier: citationTierSchema,
  tierDescription: z.string(),
  /** The single worst finding in words, or null when nothing was found. */
  headline: z.string().nullable(),
  findings: z.array(citationFindingSchema),
  counts: citationCountsSchema,
  /** Site-wide, not per page: one robots.txt governs every URL under it. */
  agents: z.array(agentPostureSchema),
  profile: pageProfileSchema,
  sources: citationSourcesSchema,
  /** The handle this reading was recorded under, for carrying into LumioGuard. */
  siteKey: z.string().nullable(),
  scannedAt: z.string(),
});

export const citationRequestSchema = z.object({
  url: z.string({ required_error: 'A URL is required' }).min(1, 'A URL is required'),
});

export const citedPageSchema = z.object({
  url: z.string(),
  depth: z.number(),
  score: z.number(),
  tier: citationTierSchema,
  title: z.string().nullable(),
  findingCount: z.number(),
});

/** One finding rolled up across every page of a crawl that it fired on. */
export const citationSignalSchema = z.object({
  id: z.string(),
  impact: impactSchema,
  /** What this finding cost the score. Lets a multi-tool surface rank across tools. */
  weight: z.number(),
  area: citeAreaSchema,
  title: z.string(),
  detail: z.string(),
  evidence: z.string().nullable(),
  pages: z.number(),
  firstSeen: z.string(),
  /** False when this only ever fired behind the entry page. */
  onEntry: z.boolean(),
});

export const citationSiteVerdictSchema = z.object({
  score: z.number(),
  tier: citationTierSchema,
  tierDescription: z.string(),
  headline: z.string().nullable(),
  /** How the site score was reached, said plainly, because it is not an average. */
  method: z.string(),
  entryScore: z.number().nullable(),
  medianPageScore: z.number(),
  worstPage: z.object({ url: z.string(), score: z.number(), tier: citationTierSchema }).nullable(),
  /** Findings that never appeared on the entry page. Reported, never charged. */
  hiddenFindings: z.number(),
  /** How much an entry-page-only reading would have missed. */
  hiddenDelta: z.number().nullable(),
  uniqueFindings: z.number(),
});

export const citationCrawlResponseSchema = z.object({
  entry: z.string(),
  host: z.string(),
  pagesScanned: z.number(),
  maxDepthReached: z.number(),
  requestedDepth: z.number(),
  requestedMaxPages: z.number(),
  site: citationSiteVerdictSchema,
  signals: z.array(citationSignalSchema),
  pages: z.array(citedPageSchema),
  errors: z.array(z.object({ url: z.string(), error: z.string() })),
  agents: z.array(agentPostureSchema),
  profile: pageProfileSchema,
  sources: citationSourcesSchema,
  siteKey: z.string().nullable(),
  fetchedAt: z.string(),
});

export type CitationFindingDto = z.infer<typeof citationFindingSchema>;
export type AgentPostureDto = z.infer<typeof agentPostureSchema>;
export type PageProfileDto = z.infer<typeof pageProfileSchema>;
export type CitationSourcesDto = z.infer<typeof citationSourcesSchema>;
export type CitationCountsDto = z.infer<typeof citationCountsSchema>;
export type CitationResponse = z.infer<typeof citationResponseSchema>;
export type CitationRequest = z.infer<typeof citationRequestSchema>;
export type CitedPageDto = z.infer<typeof citedPageSchema>;
export type CitationSignalDto = z.infer<typeof citationSignalSchema>;
export type CitationSiteVerdictDto = z.infer<typeof citationSiteVerdictSchema>;
export type CitationCrawlResponse = z.infer<typeof citationCrawlResponseSchema>;
