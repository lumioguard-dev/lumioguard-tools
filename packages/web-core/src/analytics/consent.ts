/**
 * The cookie choice, as the site hosting this console wrote it.
 *
 * THE KEY AND ITS SHAPE ARE SHARED with `assets/consent.js` in the website
 * repo, which is the only thing that writes them, and which no compiler here
 * can see. Change one and change both.
 */
const CONSENT_KEY = 'lg-consent';

export interface Consent {
  readonly analytics: boolean;
  readonly marketing: boolean;
}

/** Read-only on purpose: the banner on the marketing site is what writes this. */
type ConsentStore = Pick<Storage, 'getItem'>;

function safeStorage(): ConsentStore | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * What was chosen, or null where nothing has been. Null is NOT a refusal: a
 * visitor who landed straight on a tool page has never been shown the banner,
 * and is counted the way the site counts one who has not answered it yet.
 */
export function readConsent(storage: ConsentStore | null = safeStorage()): Consent | null {
  let raw: string | null;
  try {
    raw = storage?.getItem(CONSENT_KEY) ?? null;
  } catch {
    return null;
  }
  if (raw === null || raw === '') return null;

  // The two values the banner wrote before it grew per-category toggles.
  if (raw === 'granted') return { analytics: true, marketing: false };
  if (raw === 'denied') return { analytics: false, marketing: false };

  try {
    const parsed: unknown = JSON.parse(raw);
    // An array is an object too, and read as one it would answer "refused" for
    // a value the banner cannot have written. Nothing readable is nothing asked.
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    const record: Record<string, unknown> = { ...parsed };
    return { analytics: record.analytics === true, marketing: record.marketing === true };
  } catch {
    return null;
  }
}
