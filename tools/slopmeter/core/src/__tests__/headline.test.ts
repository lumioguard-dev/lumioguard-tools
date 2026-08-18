import { describe, expect, it } from 'vitest';
import { SlopAnalyzer } from '../SlopAnalyzer.js';
import { Finding } from '../domain/Finding.js';
import { PageSnapshot } from '../domain/PageSnapshot.js';
import { createDefaultRegistry } from '../rules/definitions/index.js';
import { headlineFor, headlineFrom } from '../scoring/Headline.js';

const registry = createDefaultRegistry();
const analyzer = new SlopAnalyzer(registry);

function tell(weight: number, phrase: string | null): { weight: number; phrase: string | null } {
  return { weight, phrase };
}

function penalty(weight: number, phrase: string | null): Finding {
  return Finding.observed({
    ruleId: `test.${weight}`,
    label: 'test',
    category: 'craft',
    axis: 'slop',
    weight,
    evidence: null,
    phrase,
  });
}

describe('the headline', () => {
  it('names the three heaviest tells, heaviest first', () => {
    expect(
      headlineFrom([tell(4, 'the light one'), tell(30, 'the heavy one'), tell(12, 'the middle')]),
    ).toBe('Mostly the heavy one, the middle, and the light one.');
  });

  it('stops at three, however many fired', () => {
    const line = headlineFrom([
      tell(30, 'first'),
      tell(20, 'second'),
      tell(10, 'third'),
      tell(9, 'fourth'),
    ]);
    expect(line).toBe('Mostly first, second, and third.');
    expect(line).not.toContain('fourth');
  });

  it('joins one and two tells without a dangling comma', () => {
    expect(headlineFrom([tell(9, 'one thing')])).toBe('Mostly one thing.');
    expect(headlineFrom([tell(9, 'one thing'), tell(4, 'another')])).toBe(
      'Mostly one thing and another.',
    );
  });

  it('skips a heavier tell with nothing to say rather than inventing one', () => {
    expect(headlineFrom([tell(40, null), tell(9, 'the only phrase here')])).toBe(
      'Mostly the only phrase here.',
    );
  });

  it('says nothing when nothing charged has a phrase', () => {
    expect(headlineFrom([tell(40, null), tell(9, null)])).toBeNull();
    expect(headlineFrom([])).toBeNull();
  });

  it('never speaks for a credit', () => {
    expect(headlineFor([penalty(-4, 'credits do not get named')])).toBeNull();
  });

  it('only ever names phrases belonging to rules that actually fired', () => {
    const result = analyzer.analyze(
      PageSnapshot.create({
        url: 'https://demo.test/',
        html: `<!doctype html><html><head><title>Create Next App</title></head>
          <body><h1>Lorem ipsum dolor sit amet</h1></body></html>`,
      }),
    );

    expect(result.headline).not.toBeNull();
    const fired = result.findings.filter((f) => f.isPenalty && f.phrase !== null);
    const named = [...fired]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map((f) => f.phrase);

    expect(named.length).toBeGreaterThan(0);
    for (const phrase of named) {
      expect(result.headline).toContain(phrase);
    }

    const silent = registry
      .all()
      .filter((rule) => !fired.some((f) => f.ruleId === rule.id))
      .map((rule) => rule.phrase)
      .filter((phrase): phrase is string => phrase !== null);
    for (const phrase of silent) {
      expect(result.headline).not.toContain(phrase);
    }
  });

  it('reads as one sentence, not a list of fragments', () => {
    const line = headlineFrom([tell(30, 'first'), tell(20, 'second'), tell(10, 'third')]);
    expect(line?.startsWith('Mostly ')).toBe(true);
    expect(line?.endsWith('.')).toBe(true);
  });

  it('keeps every phrase joinable: no full stop, no sentence capital', () => {
    for (const rule of registry.all()) {
      if (rule.phrase === null) continue;
      expect(rule.phrase, rule.id).not.toMatch(/\.$/);
      // Proper nouns are fine; a capitalised ordinary word means someone wrote
      // a sentence where a fragment belongs.
      expect(rule.phrase, rule.id).not.toMatch(/^(The|A|An|This|It|Every|Three) /);
    }
  });

  it('lets no phrase carry a comma, which would collide with the list', () => {
    // "Your Company, still unfilled" dropped between two others read as four
    // tells rather than three, and the sentence stopped parsing.
    for (const rule of registry.all()) {
      expect(rule.phrase ?? '', rule.id).not.toContain(',');
    }
  });
});
