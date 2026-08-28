import {
  PageSnapshot,
  SlopAnalyzer,
  TierResolver,
  createDefaultRegistry,
} from '@lumioguard/slopmeter-core';
import { describe, expect, it } from 'vitest';
import { ScanResultMapper } from '../mappers/ScanResultMapper.js';
import { NoScreenshotProvider } from '../services/ScreenshotProvider.js';

const registry = createDefaultRegistry();
const analyzer = new SlopAnalyzer(registry);
const mapper = new ScanResultMapper(new TierResolver(), new NoScreenshotProvider());

const SLOPPY = `<!doctype html><html><head><title>Create Next App</title>
  <meta name="generator" content="v0.dev">
  <script src="https://cdn.tailwindcss.com"></script></head>
  <body data-lov-id="x"><h1>Lorem ipsum dolor sit amet</h1>
  <p>Your Company will seamlessly unlock effortless, world-class growth.</p>
  <p>As an AI language model, I cannot browse the web.</p>
  ${'<a href="#">x</a>'.repeat(8)}<img src="a.png"><img src="b.png"><img src="c.png"><img src="d.png">
  </body></html>`;

function scan(): unknown {
  const result = analyzer.analyze(PageSnapshot.create({ url: 'https://demo.test/', html: SLOPPY }));
  return mapper.toResponse(result, new Date(0));
}

describe('the wire never carries rule identity', () => {
  it('emits no rule ids or categories anywhere in the payload', () => {
    const json = JSON.stringify(scan());

    expect(json).not.toContain('ruleId');
    expect(json).not.toContain('category');
    // Every rule id in the catalogue, checked individually: a single leak is
    // a leak, and the ids share prefixes that a coarse regex would miss.
    for (const rule of registry.all()) {
      expect(json).not.toContain(rule.id);
    }
  });

  it('still tells the visitor everything it did before', () => {
    const response = scan() as {
      score: number;
      tier: string;
      breakdown: { penalties: number; creditApplied: number };
      findings: Array<{ id: string; label: string; weight: number; evidence: string | null }>;
      provenance: Array<{ label: string }>;
    };

    // Higher is better, so a Slop page scores LOW. The penalty total is
    // unchanged: it is still what the rules charged, and only the score it is
    // subtracted from knows about the direction.
    expect(response.score).toBeLessThanOrEqual(40);
    expect(response.tier).toBe('Slop');
    expect(response.breakdown.penalties).toBeGreaterThan(0);

    // Label, weight and evidence are the whole visible report; losing any of
    // them would trade the leak for a worse product.
    const lorem = response.findings.find((f) => f.label === 'Lorem ipsum');
    expect(lorem?.weight).toBe(22);
    expect(lorem?.evidence).toBe('placeholder Latin still in the copy');

    // Provenance is still reported: it just costs nothing.
    expect(response.provenance.length).toBeGreaterThan(0);
  });

  it('gives every finding a key that is unique within the response', () => {
    const response = scan() as { findings: Array<{ id: string }>; quality: Array<{ id: string }> };
    const ids = [...response.findings, ...response.quality].map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('drops a rule that threw rather than reporting its message', () => {
    // A rule's error text comes from rule source and would describe internals.
    const failing = createDefaultRegistry();
    failing.register({
      id: 'test.explodes',
      category: 'craft',
      weight: 9,
      label: 'Always throws',
      execute: () => ({ evidence: null, error: 'ENOENT /srv/rules/secret-pack.js' }),
    } as never);

    const result = new SlopAnalyzer(failing).analyze(
      PageSnapshot.create({ url: 'https://demo.test/', html: SLOPPY }),
    );
    const json = JSON.stringify(mapper.toResponse(result, new Date(0)));

    expect(json).not.toContain('secret-pack');
    expect(json).not.toContain('Always throws');
  });
});
