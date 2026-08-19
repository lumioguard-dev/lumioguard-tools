import {
  EXPOSURE_BANDS,
  EXPOSURE_CRITICAL_FLOOR,
  EXPOSURE_MAX,
  EXPOSURE_MIN,
  ExposureTier,
} from '@lumioguard/shared';
import { describe, expect, it } from 'vitest';
import type { ExposureFinding } from '../domain/ExposureFinding.js';
import { orderFindings } from '../domain/ExposureFinding.js';
import { scoreExposure } from '../scoring/ExposureScore.js';
import { headlineFor } from '../scoring/headline.js';

/**
 * The exposure ladder. These are the claims a reader is shown, so they are
 * pinned here rather than left to whatever the weights currently add up to:
 * the numbers are a first cut and expected to move, but the SHAPE below is the
 * product and must not.
 */

function finding(severity: ExposureFinding['severity'], code = 'x'): ExposureFinding {
  return {
    code,
    severity,
    category: 'exposed-secret',
    title: `${severity} thing`,
    detail: 'detail',
    evidence: null,
    fix: null,
  };
}

describe('scoreExposure', () => {
  it('scores nothing found as the bottom of the ladder, not as a pass mark', () => {
    const result = scoreExposure([]);
    expect(result.score).toBe(EXPOSURE_MIN);
    expect(result.tier).toBe(ExposureTier.Sealed);
  });

  // The one rule that carries the product: a single readable user table is the
  // whole story, however tidy everything else is. Without the floor, one
  // critical finding on an otherwise clean site scores 40 and renders as
  // "Cracked", which reads as "some work to do" rather than "your data is
  // readable right now".
  it('pins any single critical into Wide Open, alone on an otherwise clean site', () => {
    const result = scoreExposure([finding('critical')]);
    expect(result.score).toBeGreaterThanOrEqual(EXPOSURE_CRITICAL_FLOOR);
    expect(result.tier).toBe(ExposureTier.WideOpen);
  });

  // The floor and the band it names must be ONE number. As two literals they
  // could not fail together: retuning the ladder would move the band and leave
  // the floor behind, and a critical would quietly land a tier lower than the
  // README promises.
  it('takes its floor from the top band rather than repeating the number', () => {
    const top = EXPOSURE_BANDS[EXPOSURE_BANDS.length - 1];
    expect(EXPOSURE_CRITICAL_FLOOR).toBe(top?.from);
    expect(scoreExposure([finding('critical')]).tier).toBe(top?.tier);
  });

  it('never lets a pile of lesser findings outrank a critical', () => {
    const critical = scoreExposure([finding('critical')]);
    const manyLow = scoreExposure(Array.from({ length: 12 }, (_, i) => finding('low', `l${i}`)));
    expect(critical.score).toBeGreaterThan(manyLow.score);
    expect(manyLow.tier).not.toBe(ExposureTier.WideOpen);
  });

  // Higher is worse, the opposite of every health score. A regression that
  // inverted this would still produce a plausible-looking number.
  it('runs higher as more is exposed', () => {
    const scores = [
      scoreExposure([]).score,
      scoreExposure([finding('low')]).score,
      scoreExposure([finding('medium')]).score,
      scoreExposure([finding('high')]).score,
      scoreExposure([finding('critical')]).score,
    ];
    expect(scores).toEqual([...scores].sort((a, b) => a - b));
    expect(new Set(scores).size).toBe(scores.length);
  });

  it('clamps to the top of the scale rather than running past it', () => {
    const result = scoreExposure(
      Array.from({ length: 40 }, (_, i) => finding('critical', `c${i}`)),
    );
    expect(result.score).toBe(EXPOSURE_MAX);
    expect(result.tier).toBe(ExposureTier.WideOpen);
  });

  it('counts every severity, so the report and the score cannot disagree', () => {
    const result = scoreExposure([
      finding('critical', 'a'),
      finding('high', 'b'),
      finding('high', 'c'),
      finding('low', 'd'),
    ]);
    expect(result.counts).toEqual({ critical: 1, high: 2, medium: 0, low: 1 });
  });

  it('always lands a tier and a description, for any input', () => {
    for (const n of [0, 1, 3, 7, 25]) {
      const result = scoreExposure(Array.from({ length: n }, (_, i) => finding('medium', `m${i}`)));
      expect(result.score).toBeGreaterThanOrEqual(EXPOSURE_MIN);
      expect(result.score).toBeLessThanOrEqual(EXPOSURE_MAX);
      expect(result.tierDescription.length).toBeGreaterThan(0);
    }
  });
});

describe('orderFindings', () => {
  it('puts the worst first, so the headline is the worst thing found', () => {
    const ordered = orderFindings([
      finding('low', 'a'),
      finding('critical', 'b'),
      finding('high', 'c'),
    ]);
    expect(ordered.map((f) => f.severity)).toEqual(['critical', 'high', 'low']);
  });

  // Two runs over the same site must produce the same report; ordering by code
  // within a severity is what makes the order total rather than merely sorted.
  it('is stable within a severity, so a re-read does not reshuffle the list', () => {
    const input = [finding('high', 'zebra'), finding('high', 'alpha'), finding('high', 'mango')];
    expect(orderFindings(input).map((f) => f.code)).toEqual(['alpha', 'mango', 'zebra']);
    expect(orderFindings(input)).toEqual(orderFindings([...input].reverse()));
  });

  it('does not mutate what it was given', () => {
    const input = [finding('low', 'a'), finding('critical', 'b')];
    const before = input.map((f) => f.code);
    orderFindings(input);
    expect(input.map((f) => f.code)).toEqual(before);
  });
});

describe('headlineFor', () => {
  it('is the worst finding, once ordered', () => {
    const ordered = orderFindings([finding('medium', 'a'), finding('critical', 'b')]);
    expect(headlineFor(ordered)).toBe('critical thing');
  });

  // Null, not "Nothing found": a clean read has no headline, and the surface
  // decides how to say so.
  it('is null when nothing was found', () => {
    expect(headlineFor([])).toBeNull();
  });
});
