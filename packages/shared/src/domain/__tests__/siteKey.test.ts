import { describe, expect, it } from 'vitest';
import { SITE_KEY_LENGTH, SITE_KEY_PATTERN, newSiteKey } from '../siteKey.js';

const SHAPE = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;

describe('minting a site key', () => {
  it('is six characters from an alphabet a person cannot misread', () => {
    for (let i = 0; i < 200; i += 1) {
      const key = newSiteKey();
      expect(key).toHaveLength(SITE_KEY_LENGTH);
      expect(key).toMatch(SHAPE);
    }
  });

  // The whole point of the rework: a key identifies a READING, not a site. Two
  // people scanning the same host are two readings, and handing them one key
  // meant the second overwrote the first and both saw the same verdict.
  it('mints a different key every time, so one site can hold many readings', () => {
    const keys = new Set(Array.from({ length: 2000 }, () => newSiteKey()));
    expect(keys.size).toBe(2000);
  });

  // 256 is not a multiple of 31, so taking a raw byte modulo the alphabet would
  // make the first eleven characters measurably likelier. Uniform enough that
  // every character appears, which a biased sampler would still pass, but a
  // badly broken one (a constant, a truncated alphabet) would not.
  it('uses the whole alphabet', () => {
    const seen = new Set([...Array.from({ length: 4000 }, () => newSiteKey()).join('')]);
    expect(seen.size).toBe(31);
  });

  it('publishes a pattern that matches what it mints', () => {
    expect(SITE_KEY_PATTERN.source).toBe(SHAPE.source);
    for (let i = 0; i < 100; i += 1) {
      expect(SITE_KEY_PATTERN.test(newSiteKey())).toBe(true);
    }
  });
});
