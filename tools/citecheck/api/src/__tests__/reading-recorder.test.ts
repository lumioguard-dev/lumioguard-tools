import type { CitationCrawlResponse } from '@lumioguard/shared';
import { describe, expect, it } from 'vitest';
import { readingFromCrawl } from '../services/ReadingRecorder.js';

/**
 * The severity vocabulary is LumioGuard's, not Citecheck's: the ingest validates
 * `critical | high | medium | low`, and sending `blocker` untranslated rejected
 * the whole reading. The recorder fails closed, so nothing surfaced at all.
 */
const ACCEPTED = ['critical', 'high', 'medium', 'low'];

function crawl(impacts: readonly CitationCrawlResponse['signals'][number]['impact'][]) {
  return {
    entry: 'https://example.test/',
    host: 'example.test',
    pagesScanned: 1,
    maxDepthReached: 0,
    requestedDepth: 2,
    requestedMaxPages: 15,
    site: {
      score: 74,
      tier: 'Patchy',
      tierDescription: 'd',
      headline: 'h',
      method: 'm',
      entryScore: 74,
      medianPageScore: 74,
      worstPage: null,
      hiddenFindings: 0,
      hiddenDelta: 0,
      uniqueFindings: impacts.length,
    },
    signals: impacts.map((impact, index) => ({
      id: `s${index}`,
      impact,
      weight: 1,
      area: 'document' as const,
      title: `t${index}`,
      detail: 'd',
      evidence: null,
      pages: 1,
      firstSeen: 'https://example.test/',
      onEntry: true,
    })),
    pages: [],
    errors: [],
    agents: [],
    profile: { rendering: 'served' as const, declaredType: null, generator: null },
    sources: { robotsTxt: true, sitemap: false, llmsTxt: false, agentFetch: true },
    siteKey: null,
    fetchedAt: '2026-08-20T00:00:00.000Z',
  } satisfies CitationCrawlResponse;
}

describe('what a reading sends as severity', () => {
  it('translates every impact into a severity the ingest accepts', () => {
    const reading = readingFromCrawl(crawl(['blocker', 'major', 'minor', 'absent']), 'example.com');
    for (const finding of reading.findings) {
      expect(ACCEPTED).toContain(finding.severity);
    }
  });

  /** Blocker to critical, and a flag to the bottom: it costs the score nothing. */
  it('keeps the ladder in order rather than flattening it', () => {
    const reading = readingFromCrawl(crawl(['blocker', 'major', 'minor', 'absent']), 'example.com');
    expect(reading.findings.map((finding) => finding.severity)).toEqual([
      'critical',
      'high',
      'medium',
      'low',
    ]);
  });

  it('never sends Citecheck’s own vocabulary', () => {
    const reading = readingFromCrawl(crawl(['blocker', 'absent']), 'example.com');
    const sent = JSON.stringify(reading.findings);
    expect(sent).not.toContain('blocker');
    expect(sent).not.toContain('absent');
  });
});
