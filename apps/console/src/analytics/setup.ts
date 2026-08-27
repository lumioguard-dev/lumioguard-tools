import { Analytics, type AnalyticsConfig, loadPostHog, readConsent } from '@lumioguard/web-core';
import { SITE_PARAM } from '../features/scan/useConsoleRoute.js';

/** The build-time settings this reads, as a value a test can hand over. */
export interface AnalyticsEnv {
  readonly key?: string | undefined;
  readonly host?: string | undefined;
  readonly uiHost?: string | undefined;
  /** Where this build is meant to answer. Anywhere else counts nothing. */
  readonly publicSite?: string | undefined;
}

/** A value that was actually configured, where blank and unset mean the same. */
function configured(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed === '' ? undefined : trimmed;
}

function sameOrigin(publicSite: string, here: string): boolean {
  try {
    return new URL(publicSite).origin === here;
  } catch {
    return false;
  }
}

/**
 * The configuration, or null for no analytics at all.
 *
 * TWO conditions, and both matter. The key is what a fork never has, so a fork
 * ships a console that loads nothing and calls nobody. The origin is what keeps
 * a preview deploy and a developer's laptop out of the numbers, the same
 * exclusion the marketing site makes by hostname, made here against the address
 * this build already knows it was built for.
 */
export function analyticsConfig(env: AnalyticsEnv, origin: string): AnalyticsConfig | null {
  const key = configured(env.key);
  if (key === undefined) return null;

  const publicSite = configured(env.publicSite);
  if (publicSite !== undefined && !sameOrigin(publicSite, origin)) return null;

  return {
    key,
    host: configured(env.host),
    uiHost: configured(env.uiHost),
    stripParams: [SITE_PARAM],
  };
}

const ENV: AnalyticsEnv = {
  key: import.meta.env.VITE_POSTHOG_KEY,
  host: import.meta.env.VITE_POSTHOG_HOST,
  uiHost: import.meta.env.VITE_POSTHOG_UI_HOST,
  publicSite: import.meta.env.VITE_PUBLIC_SITE_URL,
};

/** Built once, in `main.tsx`, and handed to the tree through the provider. */
export function consoleAnalytics(): Analytics {
  const config = analyticsConfig(ENV, window.location.origin);
  return config === null ? Analytics.off() : new Analytics(loadPostHog(config, readConsent()));
}
