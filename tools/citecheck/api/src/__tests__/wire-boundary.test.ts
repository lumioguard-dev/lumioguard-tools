import type { CiteFinding, PageResult, SiteReport } from '@lumioguard/citecheck-core';
import { citationCrawlResponseSchema, citationResponseSchema } from '@lumioguard/shared';
import { describe, expect, it } from 'vitest';
import { toCitationResponse } from '../mappers/CitationMapper.js';
import { toCrawlResponse } from '../mappers/SiteReportMapper.js';

/**
 * The boundary this guards is INVISIBLE: nothing breaks and no screen looks
 * wrong when a mapper spreads the domain object onto the response. Two things
 * must never cross: the `code`, and the `fix` the hand-off exists to sell.
 */
const FINDING: CiteFinding = {
  code: 'access.shell',
  impact: 'blocker',
  area: 'access',
  title: 'The page is empty until JavaScript runs',
  detail: 'detail',
  evidence: '<div id="root"></div>',
  fix: 'Server-render the page.',
};

const RESULT: PageResult = {
  url: 'https://example.test/',
  host: 'example.test',
  title: 'Example',
  description: null,
  findings: [FINDING],
  profile: { rendering: 'shell', declaredType: null, generator: null },
};

const SOURCES = { robotsTxt: true, sitemap: false, llmsTxt: false, agentFetch: true };

function keysDeep(value: unknown, into: Set<string> = new Set()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) keysDeep(item, into);
    return into;
  }
  if (typeof value === 'object' && value !== null) {
    for (const [key, nested] of Object.entries(value)) {
      into.add(key);
      keysDeep(nested, into);
    }
  }
  return into;
}

describe('the scan response', () => {
  const response = toCitationResponse({
    result: RESULT,
    siteFindings: [],
    agents: [{ agent: 'GPTBot', operator: 'OpenAI', access: 'allowed', rule: 'User-agent: *' }],
    sources: SOURCES,
    siteKey: null,
    scannedAt: '2026-08-19T00:00:00.000Z',
  });

  it('carries neither the check that fired nor the fix for it', () => {
    const keys = keysDeep(response);
    expect(keys.has('code')).toBe(false);
    expect(keys.has('fix')).toBe(false);
    expect(JSON.stringify(response)).not.toContain('access.shell');
    expect(JSON.stringify(response)).not.toContain('Server-render');
  });

  it('matches the schema the client validates against', () => {
    expect(citationResponseSchema.safeParse(response).success).toBe(true);
  });

  /** The id exists so a list can be keyed, and must carry nothing else. */
  it('gives each finding an opaque, position-based id', () => {
    expect(response.findings.map((item) => item.id)).toEqual(['f0']);
  });

  it('derives the headline from the finding it reported', () => {
    expect(response.headline).toBe(FINDING.title);
  });
});

describe('the crawl response', () => {
  const report: SiteReport = {
    entry: 'https://example.test/',
    host: 'example.test',
    pagesScanned: 1,
    maxDepthReached: 0,
    requestedDepth: 2,
    requestedMaxPages: 15,
    site: {
      score: 60,
      tier: 'Unreadable',
      tierDescription: 'A machine gets nothing it can use from this page.',
      headline: FINDING.title,
      method: 'method',
      entryScore: 60,
      medianPageScore: 60,
      worstPage: { url: 'https://example.test/', score: 60, tier: 'Unreadable' },
      hiddenFindings: 0,
      hiddenDelta: 0,
      uniqueFindings: 1,
    },
    signals: [{ ...FINDING, pages: 1, firstSeen: 'https://example.test/', onEntry: true }],
    pages: [
      {
        url: 'https://example.test/',
        depth: 0,
        score: 60,
        tier: 'Unreadable',
        title: 'Example',
        findingCount: 1,
      },
    ],
    errors: [],
    profile: RESULT.profile,
  };

  const response = toCrawlResponse({
    report,
    agents: [],
    sources: SOURCES,
    siteKey: null,
    fetchedAt: '2026-08-19T00:00:00.000Z',
  });

  it('carries neither the check that fired nor the fix for it', () => {
    const keys = keysDeep(response);
    expect(keys.has('code')).toBe(false);
    expect(keys.has('fix')).toBe(false);
    expect(JSON.stringify(response)).not.toContain('access.shell');
    expect(JSON.stringify(response)).not.toContain('Server-render');
  });

  it('matches the schema the client validates against', () => {
    expect(citationCrawlResponseSchema.safeParse(response).success).toBe(true);
  });
});
