import type { AgentPostureDto, PageProfileDto } from '@lumioguard/shared';
import { checkCloaking } from './access/cloaking.js';
import type { AgentView } from './access/cloaking.js';
import { checkDirectives } from './access/directives.js';
import { readRendering } from './access/rendering.js';
import { checkCrawlable, checkSitemapConflict, checkWellKnown } from './access/wellKnown.js';
import type { WellKnown } from './access/wellKnown.js';
import { checkEvidence } from './answer/evidence.js';
import {
  type Delivery,
  checkDelivery,
  checkMetaRefresh,
  checkMobile,
  checkTransport,
} from './document/delivery.js';
import { checkCanonicalCount, checkHead } from './document/head.js';
import { checkHreflang } from './document/hreflang.js';
import { checkOutline } from './document/outline.js';
import { checkReferences } from './document/references.js';
import type { CiteFinding } from './domain/CiteFinding.js';
import { PageDocument } from './read/PageDocument.js';
import { checkClaims } from './structured/claims.js';
import { primaryNode, readJsonLd, typesOf } from './structured/jsonLd.js';

export interface PageInput {
  readonly url: string;
  readonly html: string;
  readonly headers?: Record<string, string>;
  /** What it took to reach the page. Null when the caller did not record it. */
  readonly delivery?: Delivery | null;
}

/**
 * The site-wide half of a reading: one robots.txt, one sitemap and one llms.txt
 * govern every URL beneath them, so they are fetched once and passed to every
 * page rather than re-read per page during a crawl.
 */
export interface SiteContext {
  readonly wellKnown: WellKnown;
  /** Whether a general crawler is disallowed this path. */
  readonly disallowedForAll: boolean;
  /** The crawler-user-agent fetch of the entry page, when one was made. */
  readonly agentView: AgentView | null;
}

export interface PageResult {
  readonly url: string;
  readonly host: string;
  readonly title: string | null;
  /** Carried so a crawl can compare pages against each other. */
  readonly description: string | null;
  readonly findings: readonly CiteFinding[];
  readonly profile: PageProfileDto;
}

export const NO_SITE_CONTEXT: SiteContext = Object.freeze({
  wellKnown: Object.freeze({
    robots: Object.freeze({ groups: [], sitemaps: [], present: false, invalidLines: [] }),
    llmsTxt: null,
    sitemap: null,
    postures: Object.freeze([] as readonly AgentPostureDto[]),
  }),
  disallowedForAll: false,
  agentView: null,
});

/**
 * The four areas are asked in the order a reader hits them: can a machine reach
 * this at all, does it say what it is, is the document sound, and is there
 * anything worth quoting. Every check is a pure function of what was served.
 */
export function analyzePage(input: PageInput, site: SiteContext): PageResult {
  const page = PageDocument.read(input);
  const ld = readJsonLd(page.jsonLdBlocks);
  const rendering = readRendering(page);

  const findings: CiteFinding[] = [
    ...checkDirectives(page),
    ...rendering.findings,
    ...checkCrawlable(site.disallowedForAll, new URL(page.url).pathname),
    ...checkSitemapConflict(site.wellKnown.sitemap, site.disallowedForAll),
    ...checkCloaking(page.contentWordCount, site.agentView),

    ...checkClaims(page, ld),

    ...checkHead(page),
    ...checkCanonicalCount(page),
    ...checkOutline(page),
    ...checkHreflang(page),
    ...checkReferences(page),
    ...checkDelivery(page, input.delivery ?? null),
    ...checkTransport(page),
    ...checkMobile(page),
    ...checkMetaRefresh(page),

    ...checkEvidence(page, ld),
  ];

  const primary = primaryNode(ld.nodes);

  return {
    url: page.url,
    host: page.host,
    title: page.title,
    description: page.meta.description ?? null,
    findings,
    profile: {
      rendering: rendering.rendering,
      declaredType: primary === null ? null : (typesOf(primary)[0] ?? null),
      generator: page.meta.generator ?? null,
    },
  };
}

/**
 * The checks that belong to the SITE rather than a page. Kept out of
 * `analyzePage` because a crawl would report one missing sitemap per page.
 */
export function analyzeSite(wellKnown: WellKnown): CiteFinding[] {
  return checkWellKnown(wellKnown);
}
