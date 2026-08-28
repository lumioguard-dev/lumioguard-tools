import { describe, expect, it } from 'vitest';
import { parseConsent, readConsent } from '../consent.js';

describe('parseConsent', () => {
  it('reads the shape the banner writes', () => {
    expect(parseConsent('{"analytics":true,"marketing":false}')).toEqual({ analytics: true });
    expect(parseConsent('{"analytics":false,"marketing":true}')).toEqual({ analytics: false });
  });

  it('still reads the two values that banner wrote before it had toggles', () => {
    expect(parseConsent('granted')).toEqual({ analytics: true });
    expect(parseConsent('denied')).toEqual({ analytics: false });
  });

  // Nothing stored is a visitor who has not been asked, which the caller treats
  // as the site does: counted cookielessly, never as an acceptance.
  it('answers null for nothing stored, and for anything unreadable', () => {
    for (const raw of [null, '', 'not json', '[1,2]', '"granted"', 'null', '42']) {
      expect(parseConsent(raw), raw ?? 'null').toBeNull();
    }
  });

  it('takes only a literal true as consent', () => {
    expect(parseConsent('{"analytics":"yes"}')).toEqual({ analytics: false });
    expect(parseConsent('{}')).toEqual({ analytics: false });
  });
});

describe('readConsent', () => {
  it('reads the key the marketing site writes, and nothing else', () => {
    const asked: string[] = [];
    const consent = readConsent({
      getItem: (key) => {
        asked.push(key);
        return 'granted';
      },
    });
    expect(asked).toEqual(['lg-consent']);
    expect(consent).toEqual({ analytics: true });
  });

  it('answers null when storage itself throws', () => {
    expect(
      readConsent({
        getItem: () => {
          throw new Error('blocked');
        },
      }),
    ).toBeNull();
  });

  it('answers null when there is no storage at all', () => {
    expect(readConsent(null)).toBeNull();
  });
});
