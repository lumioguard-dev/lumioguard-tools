import { ErrorCode, errorResponseSchema } from '@lumioguard/shared';
import type { z } from 'zod';

export class ScanApiError extends Error {
  public readonly code: string;

  public constructor(code: string, message: string) {
    super(message);
    this.name = 'ScanApiError';
    this.code = code;
  }
}

/**
 * The transport every tool's client shares. Subclasses add the one or two calls
 * their API actually serves; this owns the base URL, the error envelope and the
 * response validation.
 */
export abstract class ApiClient {
  private readonly baseUrl: string;

  /** Required: every caller builds it from the tool's id, see `apiBase`. */
  public constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  protected async post<T>(
    path: string,
    body: unknown,
    schema: z.ZodType<T>,
    signal?: AbortSignal,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });

    const payload: unknown = await response.json().catch(() => null);

    // The failure envelope goes through its own schema for the same reason the
    // success body does: read behind a cast, an error answered in some other
    // shape became `undefined` and reached the visitor as the generic fallback.
    if (!response.ok) {
      const failure = errorResponseSchema.safeParse(payload);
      throw failure.success
        ? new ScanApiError(failure.data.error.code, failure.data.error.message)
        : new ScanApiError(ErrorCode.RequestFailed, 'The scan failed');
    }

    // Validated rather than cast: a shape change in the API should surface here,
    // not as an undefined three components deep.
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      throw new ScanApiError(ErrorCode.BadResponse, 'The API returned an unexpected shape');
    }
    return parsed.data;
  }
}
