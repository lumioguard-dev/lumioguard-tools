import { z } from 'zod';

export const ErrorCode = {
  InvalidRequest: 'invalid_request',
  InvalidTarget: 'invalid_target',
  NotFound: 'not_found',
  InternalError: 'internal_error',
  RequestFailed: 'request_failed',
  BadResponse: 'bad_response',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
