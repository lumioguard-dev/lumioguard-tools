import type { ExposureFinding } from '../domain/ExposureFinding.js';

interface Signature {
  readonly name: string;
  readonly pattern: RegExp;
}

/** Matched by the DOMAIN the script loads from, never by a name a minifier reproduces. */
const TRACKERS: readonly Signature[] = [
  { name: 'Google Analytics', pattern: /googletagmanager\.com|google-analytics\.com/i },
  { name: 'Meta Pixel', pattern: /connect\.facebook\.net/i },
  { name: 'TikTok Pixel', pattern: /analytics\.tiktok\.com/i },
  { name: 'LinkedIn Insight', pattern: /snap\.licdn\.com/i },
  { name: 'Hotjar', pattern: /static\.hotjar\.com/i },
  { name: 'Mixpanel', pattern: /cdn\.mxpnl\.com|api\.mixpanel\.com/i },
  { name: 'Segment', pattern: /cdn\.segment\.com/i },
  { name: 'Amplitude', pattern: /cdn\.amplitude\.com|api\d*\.amplitude\.com/i },
];

/** Consent Management Platforms and hand-rolled banners leave one of these tells. */
const CONSENT =
  /onetrust|optanon|cookiebot|cookieyes|cookieconsent|cookie-consent|klaro|termly|iubenda|usercentrics|cookiefirst|\bcmp\b|we use cookies|accept (all )?cookies|manage cookies|cookie preferences/i;

const PRIVACY_LINK = /href=["'][^"']*privacy[^"']*["']|>\s*privacy(\s+policy)?\s*</i;

export function checkPrivacy(html: string, sources: string): ExposureFinding[] {
  const findings: ExposureFinding[] = [];

  const trackers = TRACKERS.filter((t) => t.pattern.test(sources)).map((t) => t.name);
  // Consent is checked across the bundles too, not just the markup: a CMP is
  // usually a script (OneTrust, Cookiebot, a hand-rolled banner component), so
  // reading only the HTML missed it and cried "no consent" on sites that have it.
  const hasConsent = CONSENT.test(sources);
  const hasPrivacyLink = PRIVACY_LINK.test(html);
  const collectsData = trackers.length > 0 || /<form\b/i.test(html);

  if (trackers.length > 0 && !hasConsent) {
    findings.push({
      code: 'privacy:no-consent',
      severity: 'medium',
      category: 'privacy',
      title: 'Trackers run with no cookie-consent gate',
      detail:
        'Analytics or advertising trackers load on page view, and nothing on the page asks for consent first. In the EU and UK that sets non-essential cookies before consent, which is what regulators fine.',
      evidence: `Trackers found: ${trackers.join(', ')}; no consent banner detected`,
      fix: 'Add a consent banner that blocks non-essential scripts until the visitor opts in.',
    });
  }

  if (collectsData && !hasPrivacyLink) {
    findings.push({
      code: 'privacy:no-policy',
      severity: 'low',
      category: 'privacy',
      title: 'No privacy policy linked',
      detail:
        'The page collects personal data (a form, or third-party trackers) but links no privacy policy. Most data-protection laws require one wherever data is collected.',
      evidence:
        trackers.length > 0
          ? `Collects via: form/${trackers.length} tracker(s)`
          : 'Collects via: a form',
      fix: 'Publish a privacy policy and link it from every page that collects data.',
    });
  }

  return findings;
}
