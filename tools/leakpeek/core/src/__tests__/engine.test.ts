import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import { analyzePassive } from '../ExposureAnalyzer.js';
import { orderFindings } from '../domain/ExposureFinding.js';
import { checkSecurityHeaders } from '../passive/headers.js';
import { checkPrivacy } from '../passive/privacy.js';
import { maskSecret, scanForSecrets } from '../passive/secrets.js';
import { discoverSupabase } from '../passive/supabaseDiscovery.js';
import { EXPOSED_FILE_CHECKS, interpretExposedFile } from '../probes/exposedFiles.js';
import { interpretTableRead } from '../probes/supabase.js';
import { scoreExposure } from '../scoring/ExposureScore.js';

// A JWT with a chosen `role` claim, unsigned: the signature is not read.
function jwt(role: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ role, iss: 'supabase' })).toString('base64url');
  return `${header}.${payload}.c2lnbmF0dXJlc2lnbmF0dXJl`;
}

describe('secret scanning', () => {
  it('reports a service_role JWT and never the anon key beside it', () => {
    const bundle = `const anon="${jwt('anon')}"; const svc="${jwt('service_role')}";`;
    const findings = scanForSecrets(bundle);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.code).toBe('secret:supabase-service-role');
    expect(findings[0]?.severity).toBe('critical');
  });

  it('masks the secret in evidence rather than reprinting it', () => {
    const key = 'sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ0123';
    const [finding] = scanForSecrets(`const k = "${key}"`);
    expect(finding?.evidence).not.toContain(key);
    expect(finding?.evidence).toContain(maskSecret(key));
  });

  it('finds a live Stripe secret key', () => {
    const [finding] = scanForSecrets('sk_live_51ABCDEFGHIJKLMNOPQRSTUV');
    expect(finding?.code).toBe('secret:stripe-live');
  });
});

describe('security headers', () => {
  it('flags each missing header and nothing that is present', () => {
    const codes = checkSecurityHeaders({ 'strict-transport-security': 'max-age=1' }).map(
      (f) => f.code,
    );
    expect(codes).toContain('header:csp');
    expect(codes).toContain('header:frame');
    expect(codes).not.toContain('header:hsts');
  });

  it('treats a frame-ancestors CSP as covering clickjacking', () => {
    const codes = checkSecurityHeaders({
      'content-security-policy': "default-src 'self'; frame-ancestors 'none'",
      'strict-transport-security': 'max-age=1',
    }).map((f) => f.code);
    expect(codes).not.toContain('header:frame');
  });
});

describe('supabase discovery', () => {
  it('pairs the project ref with the anon key', () => {
    const ref = 'abcdefghijklmnopqrst';
    const target = discoverSupabase(`https://${ref}.supabase.co ${jwt('anon')}`);
    expect(target?.ref).toBe(ref);
    expect(target?.url).toBe(`https://${ref}.supabase.co`);
  });

  it('returns null with no project url', () => {
    expect(discoverSupabase(jwt('anon'))).toBeNull();
  });

  it('finds a modern sb_publishable_ key when there is no anon JWT', () => {
    const ref = 'abcdefghijklmnopqrst';
    const key = 'sb_publishable_AbCdEf0123456789xyz';
    const target = discoverSupabase(`https://${ref}.supabase.co createClient("${key}")`);
    expect(target?.apiKey).toBe(key);
  });
});

describe('privacy', () => {
  it('flags trackers running with no consent gate', () => {
    const html =
      '<html><head><script src="https://www.googletagmanager.com/gtag/js"></script></head><body><form></form></body></html>';
    const codes = checkPrivacy(html, html).map((f) => f.code);
    expect(codes).toContain('privacy:no-consent');
  });

  it('does not flag trackers when a consent banner is present', () => {
    const html =
      '<html><script src="https://connect.facebook.net/x.js"></script><div class="cookieconsent">We use cookies</div></html>';
    const codes = checkPrivacy(html, html).map((f) => f.code);
    expect(codes).not.toContain('privacy:no-consent');
  });

  it('flags a data-collecting page with no privacy policy link', () => {
    const html = '<html><body><form><input name="email"/></form></body></html>';
    const codes = checkPrivacy(html, html).map((f) => f.code);
    expect(codes).toContain('privacy:no-policy');
  });

  it('says nothing on a static page with a privacy link and no form', () => {
    const html = '<html><body><a href="/privacy">Privacy Policy</a></body></html>';
    expect(checkPrivacy(html, html)).toHaveLength(0);
  });
});

describe('exposed files', () => {
  const envCheck = EXPOSED_FILE_CHECKS.find((c) => c.path === '/.env');

  it('reports a served .env that looks like env, not an SPA HTML 200', () => {
    if (!envCheck) throw new Error('env check missing');
    expect(
      interpretExposedFile(envCheck, 200, 'DATABASE_URL=postgres://x\nAPI_KEY=abc')?.severity,
    ).toBe('critical');
    // An SPA that answers 200 with its shell for any path is not a finding.
    expect(interpretExposedFile(envCheck, 200, '<!doctype html><html></html>')).toBeNull();
    expect(interpretExposedFile(envCheck, 404, '')).toBeNull();
  });
});

describe('RLS interpretation', () => {
  it('reports a critical only when rows actually return', () => {
    const rows = [{ id: 1, email: 'a@b.com', stripe_id: 'cus_1' }];
    const finding = interpretTableRead('users', 200, rows);
    expect(finding?.severity).toBe('critical');
    expect(finding?.category).toBe('missing-rls');
    // Structural evidence: shape, not values.
    expect(finding?.evidence).toContain('columns: id, email, stripe_id');
    expect(finding?.evidence).not.toContain('a@b.com');
  });

  it('says nothing on an empty 200, a 401, or a 404', () => {
    expect(interpretTableRead('users', 200, [])).toBeNull();
    expect(interpretTableRead('users', 401, null)).toBeNull();
    expect(interpretTableRead('users', 404, null)).toBeNull();
  });
});

describe('scoring', () => {
  it('pins any critical into the Wide Open band', () => {
    const result = scoreExposure([
      {
        code: 'x',
        severity: 'critical',
        category: 'missing-rls',
        title: 't',
        detail: 'd',
        evidence: null,
        fix: null,
      },
    ]);
    expect(result.score).toBeLessThanOrEqual(40);
    expect(result.tier).toBe('Wide Open');
  });

  // Higher is better: a site leaking nothing is the top of the scale.
  it('a clean site is Sealed at a hundred', () => {
    const result = scoreExposure([]);
    expect(result.score).toBe(100);
    expect(result.tier).toBe('Sealed');
  });
});

describe('passive orchestration', () => {
  it('discovers the stack and the supabase target from one bundle', () => {
    const ref = 'abcdefghijklmnopqrst';
    const html = `<html><script src="/app.js"></script></html>`;
    const body = `createClient("https://${ref}.supabase.co","${jwt('anon')}"); // data-lov-id`;
    const result = analyzePassive({
      url: 'https://x.lovable.app/',
      host: 'x.lovable.app',
      html,
      headers: { 'x-vercel-id': '1' },
      scripts: [{ url: 'https://x.lovable.app/app.js', body }],
    });
    expect(result.stack.builder).toBe('Lovable');
    expect(result.stack.hosting).toBe('Vercel');
    expect(result.stack.backend).toBe('Supabase');
    expect(result.supabase?.ref).toBe(ref);
  });

  it('does not fingerprint a tool from a mere mention of its name', () => {
    // A customer list / footer credit naming these tools must not be read as
    // being built on them: the stripe.com false positive.
    const html =
      '<html><body>Trusted by Supabase and Lovable. Built at bolt.new? No.</body></html>';
    const result = analyzePassive({
      url: 'https://stripe.com/',
      host: 'stripe.com',
      html,
      headers: {},
      scripts: [
        { url: 'https://stripe.com/app.js', body: 'const brands = ["Supabase","Lovable"]' },
      ],
    });
    expect(result.stack.builder).toBeNull();
    expect(result.stack.backend).toBeNull();
    expect(result.supabase).toBeNull();
  });

  it('does not name a CDN the app merely sits behind as its host', () => {
    // `cf-ray` says the request crossed Cloudflare's edge, which any origin on
    // any platform can sit behind. Reading it as the host told visitors their
    // Vercel app ran on Cloudflare, and the surface then said "built with" it.
    const vercelBehindCloudflare = analyzePassive({
      url: 'https://app.example.com/',
      host: 'app.example.com',
      html: '<html></html>',
      headers: { 'cf-ray': '8f2a1b3c4d5e6f70-LHR', 'x-vercel-id': 'lhr1::abc' },
      scripts: [],
    });
    expect(vercelBehindCloudflare.stack.hosting).toBe('Vercel');

    const cdnOnly = analyzePassive({
      url: 'https://app.example.com/',
      host: 'app.example.com',
      html: '<html></html>',
      headers: { 'cf-ray': '8f2a1b3c4d5e6f70-LHR', server: 'cloudflare' },
      scripts: [],
    });
    expect(cdnOnly.stack.hosting).toBeNull();

    // A `.pages.dev` host is Cloudflare actually serving the app, not proxying.
    const pages = analyzePassive({
      url: 'https://x.pages.dev/',
      host: 'x.pages.dev',
      html: '<html></html>',
      headers: { 'cf-ray': '8f2a1b3c4d5e6f70-LHR' },
      scripts: [],
    });
    expect(pages.stack.hosting).toBe('Cloudflare Pages');
  });

  it('orders findings worst-first', () => {
    const ordered = orderFindings([
      {
        code: 'a',
        severity: 'low',
        category: 'security-header',
        title: 'a',
        detail: '',
        evidence: null,
        fix: null,
      },
      {
        code: 'b',
        severity: 'critical',
        category: 'missing-rls',
        title: 'b',
        detail: '',
        evidence: null,
        fix: null,
      },
    ]);
    expect(ordered[0]?.severity).toBe('critical');
  });
});
