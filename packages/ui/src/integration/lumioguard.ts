/**
 * The LumioGuard integration, which is OPTIONAL and OFF unless configured.
 *
 * One flag governs every mention of it: the hand-off button and its offer, the
 * wordmark on the masthead, and the credit in the colophon. A fork that sets
 * nothing ships a tool that never says the word — which is the point. It must
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
 * The front door with this reading's handle attached, or null when the
 * integration is off.
 *
 * Never a sign-in path: that route has moved before and every visitor who
 * clicked landed on a 404. The app's own gate decides whether a login is needed.
 * The key comes from the reading, never derived from the address — deriving it
 * would carry everyone who scanned a host to the same stranger's verdict.
 */
export function fullAuditUrl(siteKey: string | null): string | null {
  if (AUDIT_ORIGIN === null) return null;
  const url = new URL('/', AUDIT_ORIGIN);
  if (siteKey !== null) url.searchParams.set('sitekey', siteKey);
  return url.toString();
}
