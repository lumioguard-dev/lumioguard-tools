/** What the visitor typed, turned into something worth fetching. */

export interface ParsedAddress {
  /** Host and path, no scheme. What is shown and what is put in the URL. */
  readonly address: string;
  /** Absolute, with the scheme back on. What is actually fetched. */
  readonly url: string;
}

export type AddressResult =
  | { readonly ok: true; readonly value: ParsedAddress }
  | { readonly ok: false; readonly problem: string };

/** Hosts that are legitimately dotless, so the dot rule does not reject them. */
const DOTLESS_HOSTS = new Set(['localhost']);

/** Only these can be fetched; anything else is a mistake or an attempt. */
const ALLOWED_SCHEMES = new Set(['http:', 'https:']);

const HOST_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;

export function parseAddress(input: string): AddressResult {
  const trimmed = input.trim();
  if (trimmed === '') return { ok: false, problem: 'Enter an address to read.' };

  if (/\s/.test(trimmed)) {
    return { ok: false, problem: 'A web address cannot contain spaces.' };
  }

  // A scheme is only a scheme when it carries an authority. Without the `//`,
  // `localhost:5174` and `example.com:8080` are a host and a port, and reading
  // them as schemes rejected two perfectly good addresses.
  const scheme = /^([a-z][a-z0-9+.-]*):\/\//i.exec(trimmed);
  if (scheme !== null && !ALLOWED_SCHEMES.has(`${scheme[1]?.toLowerCase()}:`)) {
    return { ok: false, problem: 'Only http and https addresses can be read.' };
  }
  // The opaque ones carry no authority, so the rule above cannot see them, and
  // they are exactly the ones worth refusing by name.
  if (/^(javascript|data|file|mailto|tel|blob|vbscript|about):/i.test(trimmed)) {
    return { ok: false, problem: 'Only http and https addresses can be read.' };
  }

  let url: URL;
  try {
    url = new URL(scheme === null ? `https://${trimmed}` : trimmed);
  } catch {
    return { ok: false, problem: 'That does not look like a web address.' };
  }

  if (!ALLOWED_SCHEMES.has(url.protocol)) {
    return { ok: false, problem: 'Only http and https addresses can be read.' };
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === '' || !HOST_PATTERN.test(hostname)) {
    return { ok: false, problem: 'That does not look like a web address.' };
  }
  if (!hostname.includes('.') && !DOTLESS_HOSTS.has(hostname)) {
    return { ok: false, problem: 'That address is missing a domain, like .com.' };
  }
  // A trailing dot is legal in DNS and breaks nothing, but a leading or doubled
  // one is a typo that resolves to nothing.
  if (hostname.startsWith('.') || hostname.includes('..')) {
    return { ok: false, problem: 'That does not look like a web address.' };
  }

  const path = url.pathname === '/' ? '' : url.pathname;
  const address = `${url.host}${path}${url.search}`;

  return { ok: true, value: { address, url: url.toString() } };
}

/**
 * Host only, and www is not a different site.
 *
 * Lives here with the rest of the address parsing rather than beside the site
 * key: it NAMES a reading and never keys one, so the two moved for different
 * reasons and the key's own file said as much.
 */
export function hostOf(address: string): string {
  try {
    const url = new URL(address.includes('://') ? address : `https://${address}`);
    return url.host.toLowerCase().replace(/^www\./, '');
  } catch {
    return address.trim().toLowerCase();
  }
}
