/**
 * THE KEY AND ITS SHAPE ARE SHARED with `assets/consent.js` in the website
 * repo, which is the only thing that writes them, and which no compiler here
 * can see. Change one and change both.
 */
const CONSENT_KEY = 'lg-consent';

/**
 * What the banner was answered with. Only the analytics category, because that
 * is the only one this console acts on: it loads no marketing tag, and a field
 * nothing reads is a promise the package does not keep.
 */
export interface Consent {
  readonly analytics: boolean;
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
 * The choice a stored value carries, or null where it carries none.
 *
 * Null is NOT a refusal. A visitor who landed straight on a tool page has never
 * been shown the banner, and is counted the way the site counts one who has not
 * answered it yet.
 */
export function parseConsent(raw: string | null): Consent | null {
  if (raw === null || raw === '') return null;

  // The two values the banner wrote before it grew per-category toggles.
  if (raw === 'granted') return { analytics: true };
  if (raw === 'denied') return { analytics: false };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  // An array is an object too, and read as one it would answer "refused" for a
  // value the banner cannot have written. Nothing readable is nothing asked.
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;

  const record: Record<string, unknown> = { ...parsed };
  return { analytics: record.analytics === true };
}

export function readConsent(storage: ConsentStore | null = safeStorage()): Consent | null {
  try {
    return parseConsent(storage?.getItem(CONSENT_KEY) ?? null);
  } catch {
    // Storage itself can throw where a browser has blocked it outright.
    return null;
  }
}
