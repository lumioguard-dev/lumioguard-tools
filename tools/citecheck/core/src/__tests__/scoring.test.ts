import { CITATION_BLOCKING_CEILING, CitationTier, type Impact } from '@lumioguard/shared';
import { describe, expect, it } from 'vitest';
import { type CiteFinding, orderFindings } from '../domain/CiteFinding.js';
import { scoreCitation } from '../scoring/CiteScore.js';
import { headlineFor } from '../scoring/headline.js';

function at(impact: Impact, code: string = impact): CiteFinding {
  return {
    code,
    impact,
    area: 'access',
    title: `${code} title`,
    detail: 'detail',
    evidence: null,
    fix: null,
  };
}

describe('the answer gap', () => {
  // Higher is better: a page with nothing in its way is the top of the scale.
  it('is the top of the scale when nothing was found', () => {
    const scored = scoreCitation([]);
    expect(scored.score).toBe(100);
    expect(scored.tier).toBe(CitationTier.Legible);
  });

  /**
   * The promise the product makes: a page that cannot be quoted at all lands in
   * the top band on the strength of that one finding, however tidy the rest of
   * it is. Asserted against the derived floor, never against a copy of 60.
   */
  it('pins any blocking finding down into the worst band', () => {
    const scored = scoreCitation([at('blocker')]);
    expect(scored.score).toBeLessThanOrEqual(CITATION_BLOCKING_CEILING);
    expect(scored.tier).toBe(CitationTier.Unreadable);
  });

  it('never falls through the bottom of the scale', () => {
    const many = Array.from({ length: 40 }, (_, index) => at('blocker', `b${index}`));
    expect(scoreCitation(many).score).toBe(0);
  });

  it('counts each impact separately', () => {
    const scored = scoreCitation([at('major', 'a'), at('major', 'b'), at('minor', 'c')]);
    expect(scored.counts).toEqual({ blocker: 0, major: 2, minor: 1, absent: 0 });
  });

  /**
   * The flag weighs NOTHING. It is listed with the findings and counted apart
   * from them, because a page that simply does not publish a canonical has not
   * done anything a reader has to pay for.
   */
  it('leaves a page of nothing but flags at the top of the scale', () => {
    const scored = scoreCitation([at('absent', 'a'), at('absent', 'b'), at('absent', 'c')]);
    expect(scored.score).toBe(100);
    expect(scored.tier).toBe(CitationTier.Legible);
    expect(scored.counts).toEqual({ blocker: 0, major: 0, minor: 0, absent: 3 });
  });

  it('leaves a flag out of the headline, so a clean page is not headlined by one', () => {
    expect(headlineFor(orderFindings([at('absent', 'a')]))).toBeNull();
    expect(headlineFor(orderFindings([at('absent', 'a'), at('minor', 'b')]))).not.toBeNull();
  });

  it('leaves a page with only minor findings quotable', () => {
    const scored = scoreCitation([at('minor', 'a'), at('minor', 'b')]);
    expect(scored.tier).toBe(CitationTier.Legible);
  });
});

describe('ordering', () => {
  it('puts the worst first and is stable within an impact', () => {
    const ordered = orderFindings([at('minor', 'z'), at('blocker', 'b'), at('major', 'm')]);
    expect(ordered.map((item) => item.code)).toEqual(['b', 'm', 'z']);
  });

  /** The headline is a finding's own words, so it can never name what was not found. */
  it('takes the headline from the worst finding', () => {
    expect(headlineFor(orderFindings([at('minor', 'z'), at('blocker', 'b')]))).toBe('b title');
    expect(headlineFor([])).toBeNull();
  });
});
