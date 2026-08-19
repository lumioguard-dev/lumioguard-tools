/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Origin of the deployed scan Worker, baked in at build time. Left unset in
   * development, where Vite proxies `/api` to the local Worker instead.
   */
  readonly VITE_API_BASE_URL?: string;
  /**
   * Origin of the LumioGuard app. THE switch for the whole optional
   * integration: unset, the default, there is no hand-off button, no offer
   * and no parent wordmark anywhere on the page. There is no fallback address,
   * so a fork advertises nothing it does not have.
   *
   * Set it in development so the hand-off lands on the local app rather than
   * the deployed one, which holds no site key from your local database.
   */
  readonly VITE_LUMIOGUARD_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
