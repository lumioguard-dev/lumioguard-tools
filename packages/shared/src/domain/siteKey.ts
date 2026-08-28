/** **Minted, not derived.** This key identifies a READING, never a site. */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export const SITE_KEY_LENGTH = 6;

/** The shape LumioGuard validates a key against, and the DB constraint mirrors. */
export const SITE_KEY_PATTERN = new RegExp(`^[${ALPHABET}]{${SITE_KEY_LENGTH}}$`);

export function newSiteKey(): string {
  const limit = 256 - (256 % ALPHABET.length);
  let out = '';
  while (out.length < SITE_KEY_LENGTH) {
    const bytes = new Uint8Array(SITE_KEY_LENGTH);
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte >= limit) continue;
      out += ALPHABET[byte % ALPHABET.length];
      if (out.length === SITE_KEY_LENGTH) break;
    }
  }
  return out;
}
