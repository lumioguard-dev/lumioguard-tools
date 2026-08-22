import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { corsFor } from '../http/cors.js';

/**
 * The Origin header is chosen by whoever is calling, so every negative case
 * here is an attempt to be let in by a value that merely looks right.
 */

async function allow(configured: string | undefined, origin: string): Promise<string | null> {
  const app = new Hono();
  app.use('*', corsFor(configured));
  app.get('/api/health', (context) => context.json({ ok: true }));
  const response = await app.request('/api/health', { headers: { Origin: origin } });
  return response.headers.get('access-control-allow-origin');
}

const LIST = 'https://lumioguard.dev,https://*.lumioguard-website.pages.dev';

describe('corsFor', () => {
  it('allows everything when unset, which is the development default', async () => {
    expect(await allow(undefined, 'http://localhost:5200')).toBe('*');
    expect(await allow('*', 'http://localhost:5200')).toBe('*');
  });

  it('allows an origin named exactly', async () => {
    expect(await allow(LIST, 'https://lumioguard.dev')).toBe('https://lumioguard.dev');
  });

  it('allows any preview subdomain of a wildcard entry', async () => {
    // Pages gives every branch its own host, so an exact list can only name the
    // branches that already existed.
    const preview = 'https://feat-tools-console.lumioguard-website.pages.dev';
    expect(await allow(LIST, preview)).toBe(preview);
  });

  it('refuses an origin that is not on the list', async () => {
    expect(await allow(LIST, 'https://evil.test')).toBeNull();
  });

  it('refuses another project on the same pages.dev', async () => {
    // The wildcard is a subdomain of ONE named host. Matching `.pages.dev`
    // would hand the API to anybody else's Cloudflare project.
    expect(await allow(LIST, 'https://someone-else.pages.dev')).toBeNull();
    expect(await allow('https://*.pages.dev', 'https://someone-else.pages.dev')).toBe(
      'https://someone-else.pages.dev',
    );
  });

  it('refuses the bare host of a wildcard entry', async () => {
    // `*.example.dev` is subdomains, not the apex. Naming the apex is a
    // separate decision and needs its own entry.
    expect(
      await allow('https://*.lumioguard-website.pages.dev', 'https://lumioguard-website.pages.dev'),
    ).toBeNull();
  });

  it('refuses a host that merely ends with the allowed text', async () => {
    // The check parses the origin; a string endsWith would take this.
    expect(await allow(LIST, 'https://evil-lumioguard-website.pages.dev')).toBeNull();
  });

  it('refuses a matching host on the wrong scheme or port', async () => {
    expect(await allow(LIST, 'http://x.lumioguard-website.pages.dev')).toBeNull();
    expect(await allow(LIST, 'https://x.lumioguard-website.pages.dev:8443')).toBeNull();
  });
});
