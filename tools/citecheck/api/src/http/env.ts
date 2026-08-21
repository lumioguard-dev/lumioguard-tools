export interface Env {
  /** Comma-separated origins allowed to call the API. `*` in development. */
  ALLOWED_ORIGINS?: string;

  /**
   * Keys the HMAC over the posted reading; the same hex value as on LumioGuard's
   * side. A SECRET, never a var. Unset switches recording off rather than
   * posting unsigned: the reading still renders, without a key.
   */
  CITECHECK_INGEST_SECRET?: string;

  /** Required alongside the secret, so a fork cannot post to an API it does not own. */
  LUMIOGUARD_API_BASE_URL?: string;
}

export type Bindings = { Bindings: Env };
