export interface Env {
  /** Comma-separated origins allowed to call the API. `*` in development. */
  ALLOWED_ORIGINS?: string;
  /** Where completed readings are recorded. */
  LUMIOGUARD_API_BASE_URL?: string;
  /**
   * Keys the HMAC over the recorded reading's body. Must match the value
   * LumioGuard holds as `SLOPMETER_INGEST_SECRET`; that endpoint is public, so
   * the signature is the only thing that distinguishes a real reading from
   * anyone who can spell the URL. 32-byte hex.
   *
   * Unset disables recording entirely: the scan still runs and still answers.
   * Recording is a side effect of a reading, never a precondition for one.
   */
  SLOPMETER_INGEST_SECRET?: string;
}

export type Bindings = { Bindings: Env };
