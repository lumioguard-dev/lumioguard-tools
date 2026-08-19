import { describe, expect, it } from 'vitest';
import { AUDIT_ORIGIN, LUMIOGUARD_ENABLED, auditOrigin, fullAuditUrl } from '../lumioguard.js';

/**
 * The one switch behind every mention of LumioGuard. Three failures this
 * guards, all of which shipped once:
 *
 *   - the hand-off pointed at `/login`, a route the other app has never had, so
 *     the one button the report offers landed every visitor on a 404;
 *   - the key was derived from the address, so everyone who scanned the same
 *     host got the same key and the link carried them to a stranger's verdict;
 *   - it defaulted to the production app, so a fork with no LumioGuard at all
 *     still advertised one.
 */
describe('auditOrigin', () => {
  // OPTIONAL by default: the tool stands alone unless an app is configured.
  it('is off when nothing is configured', () => {
    expect(auditOrigin(undefined)).toBeNull();
    expect(auditOrigin('')).toBeNull();
    expect(auditOrigin('   ')).toBeNull();
  });

  it('takes a configured origin, so a local run reaches a local app', () => {
    expect(auditOrigin('http://localhost:5173')).toBe('http://localhost:5173');
  });

  // `new URL('/', base)` tolerates it, but the trailing slash would survive
  // into anything that concatenates instead.
  it('drops a trailing slash rather than doubling it', () => {
    expect(auditOrigin('http://localhost:5173/')).toBe('http://localhost:5173');
  });
});

// Every case below needs a configured app; with none there is no link at all,
// which is the first assertion here.
describe.skipIf(AUDIT_ORIGIN === null)('fullAuditUrl, with an app configured', () => {
  const href = (key: string | null): URL => {
    const value = fullAuditUrl(key);
    if (value === null) throw new Error('expected a link');
    return new URL(value);
  };

  it('goes to the app front door, never to a sign-in path', () => {
    const url = href('K7M2XQ');
    expect(url.origin).toBe(new URL(AUDIT_ORIGIN ?? '').origin);
    expect(url.pathname).toBe('/');
  });

  it('carries this reading\u2019s key', () => {
    expect(href('K7M2XQ').searchParams.get('sitekey')).toBe('K7M2XQ');
  });

  // A reading that could not be recorded has no key. The link still works; it
  // simply arrives without one, and the app asks for a site the ordinary way.
  it('omits the parameter entirely when there is no key', () => {
    const url = href(null);
    expect(url.searchParams.has('sitekey')).toBe(false);
    expect(url.search).toBe('');
  });

  it('takes the key it is given rather than deriving one from an address', () => {
    expect(fullAuditUrl('AAAAAA')).not.toBe(fullAuditUrl('BBBBBB'));
  });
});

describe('fullAuditUrl, with no app configured', () => {
  it('answers null so the report renders no hand-off at all', () => {
    if (AUDIT_ORIGIN !== null) return;
    expect(fullAuditUrl('K7M2XQ')).toBeNull();
    expect(fullAuditUrl(null)).toBeNull();
  });
});

/**
 * The wordmark and the credit read this rather than a second condition of their
 * own. Two switches for one integration is how a fork ends up shipping a tool
 * with no button and the parent's name still on the masthead.
 */
describe('LUMIOGUARD_ENABLED', () => {
  it('is the same switch the hand-off link answers to', () => {
    expect(LUMIOGUARD_ENABLED).toBe(AUDIT_ORIGIN !== null);
    expect(LUMIOGUARD_ENABLED).toBe(fullAuditUrl('K7M2XQ') !== null);
  });

  it('is off in a run that configures nothing, which is the default', () => {
    if (AUDIT_ORIGIN !== null) return;
    expect(LUMIOGUARD_ENABLED).toBe(false);
  });
});
