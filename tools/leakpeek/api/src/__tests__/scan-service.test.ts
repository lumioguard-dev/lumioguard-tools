import { Buffer } from 'node:buffer';
import type { SupabaseTarget } from '@lumioguard/leakpeek-core';
import { describe, expect, it } from 'vitest';
import { PageFetcher } from '../services/PageFetcher.js';
import { ProbeRunner } from '../services/ProbeRunner.js';
import { ScanService } from '../services/ScanService.js';

// A JWT with a chosen role, unsigned — the signature is never read.
function jwt(role: string): string {
  const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  // The signature segment must be ≥10 chars to match the JWT regex, as a real
  // one is; a stub like "sig" is too short and the token would be skipped.
  return `${enc({ alg: 'HS256' })}.${enc({ role })}.c2lnbmF0dXJlc2lnbmF0dXJl`;
}

const ref = 'abcdefghijklmnopqrst';

class FakeFetcher extends PageFetcher {
  public override async fetchPage() {
    return {
      url: 'https://demo.lovable.app/',
      host: 'demo.lovable.app',
      title: 'Demo',
      html: '<html><title>Demo</title><script src="/app.js"></script></html>',
      headers: {},
      scripts: [
        {
          url: 'https://demo.lovable.app/app.js',
          body: `createClient("https://${ref}.supabase.co","${jwt('anon')}"); // data-lov-id`,
        },
      ],
    };
  }
}

class FakeProber extends ProbeRunner {
  public override async probeSupabase(_target: SupabaseTarget) {
    return [
      {
        code: 'supabase-rls:users',
        severity: 'critical' as const,
        category: 'missing-rls' as const,
        title: 'Table `users` is readable without signing in',
        detail: 'RLS is off.',
        evidence: 'Read 3+ row(s) unauthenticated; columns: id, email',
        fix: 'Enable RLS.',
      },
    ];
  }
  public override async checkSourceMaps() {
    return [];
  }
  public override async checkExposedFiles() {
    return [];
  }
}

describe('ScanService end to end (faked I/O)', () => {
  it('runs passive + active, scores, and maps to the wire shape', async () => {
    const service = new ScanService({
      fetcher: new FakeFetcher(),
      prober: new FakeProber(),
      clock: () => new Date('2026-01-01T00:00:00Z'),
    });
    const result = await service.scan('demo.lovable.app');

    expect(result.stack.builder).toBe('Lovable');
    expect(result.stack.backend).toBe('Supabase');
    expect(result.backendProbed).toBe(true);
    expect(result.tier).toBe('Wide Open');
    expect(result.counts.critical).toBe(1);
    expect(result.findings[0]?.category).toBe('missing-rls');
    expect(result.siteKey).toBeNull();
  });

  it('reports no backend probed when the page points at none', async () => {
    // `backendProbed` was once pinned true because the exposed-file check always
    // runs, so a clean report told the visitor it had read "the page, its scripts
    // and its backend" on sites that have no reachable backend at all.
    class NoBackendFetcher extends PageFetcher {
      public override async fetchPage() {
        return {
          url: 'https://static.example.com/',
          host: 'static.example.com',
          title: 'Static',
          html: '<html><title>Static</title></html>',
          headers: {},
          scripts: [],
        };
      }
    }

    const service = new ScanService({
      fetcher: new NoBackendFetcher(),
      prober: new FakeProber(),
    });
    const result = await service.scan('static.example.com');

    expect(result.stack.backend).toBeNull();
    expect(result.backendProbed).toBe(false);
  });

  it('never puts an internal rule code or a raw secret on the wire', async () => {
    const service = new ScanService({ fetcher: new FakeFetcher(), prober: new FakeProber() });
    const result = await service.scan('demo.lovable.app');
    const json = JSON.stringify(result);

    // The internal `code` slug must not cross; the DTO carries an opaque id.
    expect(json).not.toContain('supabase-rls:users');
    expect(result.findings.every((f) => 'id' in f && !('code' in f))).toBe(true);
    // The report names the issue, never the fix.
    expect(result.findings.every((f) => !('fix' in f))).toBe(true);
    expect(json).not.toContain('Enable RLS');
    // The anon key was in the bundle but is public by design and never reported.
    expect(json).not.toContain('eyJ');
  });
});
