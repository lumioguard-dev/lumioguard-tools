import { ErrorCode, type ErrorResponse } from '@lumioguard/shared';
import { PageFetchError } from '../services/PageFetchError.js';
import { InvalidTargetError } from '../services/TargetResolver.js';

export interface HttpFailure {
  readonly status: 400 | 404 | 500 | 502;
  readonly body: ErrorResponse;
}

function failure(status: HttpFailure['status'], code: string, message: string): HttpFailure {
  return { status, body: { error: { code, message } } };
}

/**
 * An upstream site that will not load is a 502, not a 500: the caller's request
 * was fine. Anything unrecognised is answered generically, because internal
 * messages carry file paths and rule source, and the rule pack is the product.
 */
export function toHttpFailure(error: unknown): HttpFailure {
  if (error instanceof InvalidTargetError) {
    return failure(400, ErrorCode.InvalidTarget, error.message);
  }
  if (error instanceof PageFetchError) {
    return failure(502, error.code, error.message);
  }
  console.error('unhandled', error);
  return failure(500, ErrorCode.InternalError, 'Something went wrong');
}

export const NOT_FOUND: HttpFailure = failure(404, ErrorCode.NotFound, 'No such route');
