import type { CaptureSink } from './Analytics.js';
import type { Consent } from './consent.js';
import { scrubProperties } from './redact.js';

export interface AnalyticsConfig {
  /** The project key. Without one there is no analytics, which is the default. */
  readonly key: string;
  /** Usually a first-party reverse proxy. PostHog's own host when unset. */
  readonly host?: string | undefined;
  /** Only needed behind a proxy, where toolbar links still need the real UI host. */
  readonly uiHost?: string | undefined;
  /** Query parameters to strip from the URLs PostHog collects for itself. */
  readonly stripParams?: readonly string[] | undefined;
}

/**
 * PostHog, configured EXACTLY as the marketing site configures it in
 * `assets/consent.js`: capture starts cookielessly from the first pageview and
 * an accepted banner upgrades it, so a visitor is counted whether or not they
 * have ever been asked. The two halves of one site must not count differently,
 * so every option here is answered there too.
 *
 * Loaded on its own chunk, so a build with no key configured never fetches it.
 */
export async function loadPostHog(
  config: AnalyticsConfig,
  consent: Consent | null,
): Promise<CaptureSink | null> {
  const strip = config.stripParams ?? [];
  try {
    const { default: posthog } = await import('posthog-js');
    posthog.init(config.key, {
      api_host: config.host,
      ui_host: config.uiHost,
      defaults: '2026-05-30',
      person_profiles: 'identified_only',
      cookieless_mode: 'on_reject',
      opt_out_capturing_by_default: true,
      sanitize_properties: (properties) => scrubProperties(properties, strip),
    });
    if (consent?.analytics === true) posthog.opt_in_capturing();
    else posthog.opt_out_capturing();
    return posthog;
  } catch {
    // A reading is the product and analytics is not. Anything that stops
    // PostHog loading, an ad blocker most often, leaves the console working.
    return null;
  }
}
