/**
 * An address with its query dropped, for a URL reported ON PURPOSE rather than
 * collected. The hand-off carries the reading's site keys there, and a handle
 * to somebody's report is not a thing to give a third party.
 */
export function withoutQuery(href: string): string {
  try {
    const url = new URL(href);
    return `${url.origin}${url.pathname}`;
  } catch {
    return href;
  }
}

/**
 * The scanned address out of every URL PostHog records by itself. `$current_url`
 * and its siblings are collected without being asked for, and somebody else's
 * address, typed into this box, is not a thing to give a third party.
 */
function scrubUrl(value: string, params: readonly string[]): string {
  try {
    const url = new URL(value);
    // Untouched URLs pass through as they were written. Returning
    // `url.toString()` regardless would normalise them, so a value nothing here
    // objected to would still reach PostHog changed.
    if (!params.some((param) => url.searchParams.has(param))) return value;
    for (const param of params) url.searchParams.delete(param);
    return url.toString();
  } catch {
    return value;
  }
}

export function scrubProperties(
  properties: Record<string, unknown>,
  params: readonly string[],
): Record<string, unknown> {
  if (params.length === 0) return properties;
  const scrubbed: Record<string, unknown> = { ...properties };
  for (const [name, value] of Object.entries(scrubbed)) {
    // The cheap test first: an event carries dozens of properties and most are
    // not addresses, so parsing every one of them to find out is wasted work.
    if (typeof value === 'string' && value.includes('://')) {
      scrubbed[name] = scrubUrl(value, params);
    }
  }
  return scrubbed;
}
