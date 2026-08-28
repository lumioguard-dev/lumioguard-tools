import type { RateLimiter } from '@lumioguard/api-core';

export interface Env {
  /** Comma-separated origins allowed to call the API. `*` in development. */
  ALLOWED_ORIGINS?: string;
  /** Where completed readings are recorded. */
  LUMIOGUARD_API_BASE_URL?: string;
  /**
   * 32-byte hex keying the HMAC over a recorded reading. The ingest endpoint is
   * public, so the signature is all that separates a real reading from anyone who
   * can spell the URL. Unset disables recording; the scan still runs and answers.
   */
  SLOPMETER_INGEST_SECRET?: string;
  SCAN_RATE_LIMITER?: RateLimiter;
}

export type Bindings = { Bindings: Env };
