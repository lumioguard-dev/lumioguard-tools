import type { Tier } from '@lumioguard/shared';

export interface CrawledPage {
  readonly url: string;
  readonly depth: number;
  readonly score: number;
  readonly tier: Tier;
  readonly title: string | null;
  readonly signalCount: number;
}

/** A finding rolled up across every page it fired on. */
export interface SiteSignal {
  readonly ruleId: string;
  readonly label: string;
  readonly weight: number;
  readonly evidence: string | null;
  /** Carried up from the rule so the roll-up can name its worst tells. */
  readonly phrase: string | null;
  readonly pages: number;
  readonly firstSeen: string;
  /** False when this only ever fired behind the front door. */
  readonly onHomepage: boolean;
}

export interface CrawlError {
  readonly url: string;
  readonly error: string;
}

export interface SiteVerdict {
  readonly score: number;
  readonly tier: Tier;
  readonly method: string;
  /** The site's three heaviest tells, in one sentence. Null when none has a phrase. */
  readonly headline: string | null;
  readonly homepageScore: number | null;
  readonly medianPageScore: number;
  readonly meanPageScore: number;
  readonly worstPage: { url: string; score: number; tier: Tier } | null;
  /** Signals that never appeared on the homepage. Reported, never charged. */
  readonly hiddenSignals: number;
  readonly hiddenWeight: number;
  /** How much a homepage-only scan would have missed. */
  readonly hiddenDelta: number | null;
  readonly uniqueSignals: number;
}

export class SiteReport {
  public readonly entry: string;
  public readonly pagesScanned: number;
  public readonly maxDepthReached: number;
  public readonly requestedDepth: number;
  public readonly requestedMaxPages: number;
  public readonly site: SiteVerdict;
  public readonly signals: readonly SiteSignal[];
  public readonly pages: readonly CrawledPage[];
  public readonly errors: readonly CrawlError[];

  public constructor(init: {
    entry: string;
    maxDepthReached: number;
    requestedDepth: number;
    requestedMaxPages: number;
    site: SiteVerdict;
    signals: readonly SiteSignal[];
    pages: readonly CrawledPage[];
    errors: readonly CrawlError[];
  }) {
    this.entry = init.entry;
    this.pagesScanned = init.pages.length;
    this.maxDepthReached = init.maxDepthReached;
    this.requestedDepth = init.requestedDepth;
    this.requestedMaxPages = init.requestedMaxPages;
    this.site = Object.freeze({ ...init.site });
    this.signals = Object.freeze([...init.signals]);
    this.pages = Object.freeze([...init.pages]);
    this.errors = Object.freeze([...init.errors]);
    Object.freeze(this);
  }
}
