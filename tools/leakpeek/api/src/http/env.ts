export interface Env {
  /** Comma-separated origins allowed to call the API. `*` in development. */
  ALLOWED_ORIGINS?: string;

  /**
   * Keys the HMAC over the posted reading; the same hex value as on LumioGuard's
   * side. A SECRET, never a var. Unset switches recording off rather than
   * posting unsigned — the reading still renders, without a key.
   */
  LEAKPEEK_INGEST_SECRET?: string;

  /** Unset falls back to production; point it at 127.0.0.1:8787 in dev. */
  LUMIOGUARD_API_BASE_URL?: string;
}

export type Bindings = { Bindings: Env };
