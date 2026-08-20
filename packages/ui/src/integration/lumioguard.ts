/**
 * The LumioGuard integration, which is OPTIONAL and OFF unless configured.
 *
 * One flag governs every mention of it: the hand-off button and its offer, the
 * wordmark on the masthead, and the credit in the colophon. A fork that sets
 * nothing ships a tool that never says the word, which is the point. It must
 * not advertise something it does not have, and there is no address here to
 * fall back to.
 */
export function auditOrigin(configured: string | undefined): string | null {
  const trimmed = configured?.trim();
  return trimmed ? trimmed.replace(/\/$/, '') : null;
}

export const AUDIT_ORIGIN = auditOrigin(import.meta.env.VITE_LUMIOGUARD_APP_URL);

export const LUMIOGUARD_ENABLED = AUDIT_ORIGIN !== null;

/**
 * Where the WORDMARK points, which is not where the hand-off points.
 *
 * The hand-off carries a reading into the app and needs the app. The name in
 * the masthead and the colophon is a credit, and a credit belongs on the page
 * that says what LumioGuard is, not on a product surface behind a sign-in.
 *
 * Still governed by the one switch: with no app configured there is no
 * integration and no name anywhere, so this is never consulted. It falls back
 * to the app when unset rather than to an address written here, because a fork
 * that sets one variable must not find a second one it never chose.
 */
export const PARENT_SITE = auditOrigin(import.meta.env.VITE_LUMIOGUARD_SITE_URL);

export function parentHref(): string | null {
  return AUDIT_ORIGIN === null ? null : (PARENT_SITE ?? AUDIT_ORIGIN);
}

/**
 * The separator between keys in the one `sitekey` parameter.
 *
 * A reading runs several tools and each API mints its own key. They travel
 * JOINED rather than as a repeated parameter: the app parses its search with
 * zod, `sitekey` is a string there, and `?sitekey=A&sitekey=B` arrives as an
 * ARRAY. That threw before the router matched anything and the whole app
 * rendered blank, which is not the graceful degrade it was assumed to be.
 *
 * `_` is safe because it is not in the key alphabet, which is digits and
 * upper-case letters minus the lookalikes. A joined value can only split one
 * way, so the far side needs no delimiter rules of its own.
 */
const KEY_JOINER = '_';

/**
 * The front door with this reading's handles attached, or null when the
 * integration is off.
 *
 * Never a sign-in path: that route has moved before and every visitor who
 * clicked landed on a 404. The app's own gate decides whether a login is needed.
 * The keys come from the readings, never derived from the address: deriving one
 * would carry everyone who scanned a host to the same stranger's verdict.
 *
 * EVERY key is carried, and the order is meaning. The caller passes the reading
 * that set the verdict first, and the far side lands the visitor on that tool's
 * area while importing the rest beside it.
 */
export function fullAuditUrl(siteKeys: string | null | readonly (string | null)[]): string | null {
  if (AUDIT_ORIGIN === null) return null;
  const url = new URL('/', AUDIT_ORIGIN);
  const keys = (Array.isArray(siteKeys) ? siteKeys : [siteKeys]).filter(
    (key): key is string => typeof key === 'string' && key !== '',
  );
  if (keys.length > 0) url.searchParams.set('sitekey', keys.join(KEY_JOINER));
  return url.toString();
}
