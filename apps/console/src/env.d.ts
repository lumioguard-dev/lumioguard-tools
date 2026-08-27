/// <reference types="vite/client" />

/**
 * One API origin PER TOOL, named from the tool's id.
 *
 * Left unset in development: the Vite server proxies `/<tool>/api` to that
 * tool's Worker on the port `ports.json` gives it. Production sets one per tool
 * at build time. An index signature rather than a fixed list, because
 * `apiBase()` builds the name from the registry and a fourth tool must not need
 * an edit here to be reachable.
 */
interface ImportMetaEnv {
  readonly [key: `VITE_${string}_API_URL`]: string | undefined;
  /** Absent means the whole LumioGuard integration is off. There is no default. */
  readonly VITE_LUMIOGUARD_APP_URL?: string;
  /** Where the wordmark points. Falls back to the app URL when unset. */
  readonly VITE_LUMIOGUARD_SITE_URL?: string;
  /** Absent means no analytics: nothing is loaded and nothing is sent. */
  readonly VITE_POSTHOG_KEY?: string;
  /** A first-party proxy for PostHog. Its own host when unset. */
  readonly VITE_POSTHOG_HOST?: string;
  /** Only read behind a proxy, where toolbar links still need the real UI host. */
  readonly VITE_POSTHOG_UI_HOST?: string;
  /** Where this build answers. Analytics counts nothing at any other origin. */
  readonly VITE_PUBLIC_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
