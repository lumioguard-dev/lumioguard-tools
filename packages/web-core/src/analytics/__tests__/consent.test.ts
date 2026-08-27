import { describe, expect, it } from 'vitest';
import { readConsent } from '../consent.js';

const store = (value: string | null): Pick<Storage, 'getItem'> => ({ getItem: () => value });

describe('readConsent', () => {
  it('reads the shape the banner writes', () => {
    expect(readConsent(store('{"analytics":true,"marketing":false}'))).toEqual({
      analytics: true,
      marketing: false,
    });
  });

  it('still reads the two values that banner wrote before it had toggles', () => {
    expect(readConsent(store('granted'))?.analytics).toBe(true);
    expect(readConsent(store('denied'))?.analytics).toBe(false);
  });

  // Nothing stored is a visitor who has not been asked, which the caller treats
  // as the site does: counted cookielessly, never as an acceptance.
  it('answers null for nothing stored, and for anything unreadable', () => {
    for (const raw of [null, '', 'not json', '[1,2]', '"granted"', 'null']) {
      expect(readConsent(store(raw)), raw ?? 'null').toBeNull();
    }
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

  it('takes only a literal true as consent', () => {
    expect(readConsent(store('{"analytics":"yes","marketing":1}'))).toEqual({
      analytics: false,
      marketing: false,
    });
  });
});
