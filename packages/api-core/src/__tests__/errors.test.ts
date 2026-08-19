import { ErrorCode } from '@lumioguard/shared';
import { describe, expect, it, vi } from 'vitest';
import { NOT_FOUND, toHttpFailure } from '../http/errors.js';
import { PageFetchError } from '../services/PageFetchError.js';
import { InvalidTargetError } from '../services/TargetResolver.js';

/**
 * The boundary between an internal failure and what a stranger is told.
 *
 * Internal messages carry file paths and rule source, and the rule pack is the
 * product, so anything unrecognised has to come back generic. The failure this
 * guards is silent: a thrown Error whose message reaches the wire looks like a
 * perfectly ordinary error response.
 */

describe('toHttpFailure', () => {
  it('answers a bad target with 400 and says what was wrong, since the caller can fix it', () => {
    const failure = toHttpFailure(new InvalidTargetError('That host is not reachable'));
    expect(failure.status).toBe(400);
    expect(failure.body.error.code).toBe(ErrorCode.InvalidTarget);
    expect(failure.body.error.message).toBe('That host is not reachable');
  });

  // 502 not 500: the caller's request was fine, and the same request against a
  // different site will work. A 500 tells them to report a bug that is not ours.
  it('answers an unreachable upstream with 502, carrying that error’s own code', () => {
    const failure = toHttpFailure(new PageFetchError('timeout', 'The site took too long'));
    expect(failure.status).toBe(502);
    expect(failure.body.error.code).toBe('timeout');
  });

  it('answers anything unrecognised generically, leaking nothing about the internals', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const secret = 'ENOENT /srv/rules/definitions/craftRules.ts: rule slop.gradient-text';
    const failure = toHttpFailure(new Error(secret));

    expect(failure.status).toBe(500);
    expect(failure.body.error.code).toBe(ErrorCode.InternalError);
    expect(failure.body.error.message).toBe('Something went wrong');
    expect(JSON.stringify(failure)).not.toContain('craftRules');
    expect(JSON.stringify(failure)).not.toContain('slop.gradient-text');

    // Still logged, so an operator can see what a visitor was spared.
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it.each([null, undefined, 'a string', 42, { message: 'not an Error' }])(
    'answers %j generically rather than throwing on it',
    (thrown) => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const failure = toHttpFailure(thrown);
      expect(failure.status).toBe(500);
      expect(failure.body.error.message).toBe('Something went wrong');
      spy.mockRestore();
    },
  );
});

describe('NOT_FOUND', () => {
  it('is a 404 with a code the client can branch on', () => {
    expect(NOT_FOUND.status).toBe(404);
    expect(NOT_FOUND.body.error.code).toBe(ErrorCode.NotFound);
  });
});
