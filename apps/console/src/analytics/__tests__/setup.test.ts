import { describe, expect, it } from 'vitest';
import { type AnalyticsEnv, analyticsConfig } from '../setup.js';

const HERE = 'https://lumioguard.dev';
const env = (over: AnalyticsEnv): AnalyticsEnv => ({ key: 'phc_test', publicSite: HERE, ...over });

describe('analyticsConfig', () => {
  // The switch a fork never throws. No key, no chunk fetched and no request made.
  it('is off with no key', () => {
    expect(analyticsConfig({ ...env({}), key: undefined }, HERE)).toBeNull();
    expect(analyticsConfig({ ...env({}), key: '  ' }, HERE)).toBeNull();
  });

  // The exclusion the marketing site makes by hostname, made here against the
  // address this build was made for: a preview deploy is not the product.
  it('is off anywhere but the origin the build was made for', () => {
    expect(analyticsConfig(env({}), 'https://lumioguard-readout.pages.dev')).toBeNull();
    expect(analyticsConfig(env({}), 'http://127.0.0.1:5200')).toBeNull();
  });

  it('ignores the path on the public site, which is an origin question', () => {
    expect(analyticsConfig(env({ publicSite: `${HERE}/tools` }), HERE)).not.toBeNull();
  });

  it('is on everywhere when no public site was configured', () => {
    expect(analyticsConfig({ key: 'phc_test' }, 'http://127.0.0.1:5200')).not.toBeNull();
  });

  it('is off when the public site cannot be read as an address', () => {
    expect(analyticsConfig(env({ publicSite: 'lumioguard.dev' }), HERE)).toBeNull();
  });

  it('carries the hosts, and the parameter that must never reach PostHog', () => {
    expect(
      analyticsConfig(
        env({ host: 'https://p.lumioguard.dev', uiHost: 'https://us.posthog.com' }),
        HERE,
      ),
    ).toEqual({
      key: 'phc_test',
      host: 'https://p.lumioguard.dev',
      uiHost: 'https://us.posthog.com',
      stripParams: ['site'],
    });
  });
});
