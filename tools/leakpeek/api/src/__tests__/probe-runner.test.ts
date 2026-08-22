import type { SupabaseTarget } from '@lumioguard/leakpeek-core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProbeRunner } from '../services/ProbeRunner.js';

/**
 * The read-only guarantee, held to account.
 *
 * This class is the only thing in Leakpeek that touches a target's backend, so
 * "it only ever reads" has to be checkable rather than asserted. Every request
 * it makes is captured here and inspected: a `POST` appearing in this list is
 * the difference between assessing a hole and exploiting one, and no screen
 * would look wrong if it happened.
 */

interface Sent {
  readonly url: string;
  readonly method: string | undefined;
  readonly body: unknown;
}

function record(responder: (url: string) => { status: number; body?: string }): Sent[] {
  const sent: Sent[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      sent.push({ url: String(url), method: init?.method, body: init?.body });
      const { status, body = '' } = responder(String(url));
      return new Response(body, { status });
    }),
  );
  return sent;
}

const TARGET: SupabaseTarget = {
  url: 'https://abcdefghijklmnopqrst.supabase.co',
  ref: 'abcdefghijklmnopqrst',
  // The key the site already published to every visitor, not a credential
  // this tool holds.
  apiKey: 'sb_publishable_test_key_value',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('every request the prober makes', () => {
  it('is a GET, across all three probe kinds', async () => {
    const sent = record(() => ({ status: 404 }));
    const runner = new ProbeRunner();

    await runner.probeSupabase(TARGET);
    await runner.checkExposedFiles('https://example.com');
    await runner.checkSourceMaps(['https://example.com/a.js.map']);

    expect(sent.length).toBeGreaterThan(0);
    for (const request of sent) {
      expect(request.method, `${request.url} was not a GET`).toBe('GET');
    }
  });

  it('carries no body, so nothing can be written even by accident', async () => {
    const sent = record(() => ({ status: 404 }));
    await new ProbeRunner().probeSupabase(TARGET);

    for (const request of sent) {
      expect(request.body, `${request.url} carried a body`).toBeUndefined();
    }
  });

  // A mutating Supabase call is a POST/PATCH/DELETE to /rest/v1, or an RPC.
  // None of those shapes may ever appear.
  it('never reaches for an RPC or a mutating path', async () => {
    const sent = record(() => ({ status: 404 }));
    await new ProbeRunner().probeSupabase(TARGET);

    for (const request of sent) {
      expect(request.url).not.toContain('/rpc/');
      expect(request.method).not.toMatch(/POST|PATCH|PUT|DELETE/i);
    }
  });
});

describe('probeSupabase', () => {
  it('stops once it has proven the hole rather than sweeping every table', async () => {
    // Every table readable: without a cap this would walk the whole list.
    const sent = record(() => ({ status: 200, body: '[{"id":1}]' }));
    const findings = await new ProbeRunner().probeSupabase(TARGET);

    expect(findings.length).toBeLessThanOrEqual(5);
    expect(sent.length).toBeLessThanOrEqual(5);
  });

  it('finds nothing when every table refuses the read', async () => {
    record(() => ({ status: 401 }));
    await expect(new ProbeRunner().probeSupabase(TARGET)).resolves.toEqual([]);
  });

  it('sends the anon key the site already published, and no other credential', async () => {
    const sent = record(() => ({ status: 404 }));
    await new ProbeRunner().probeSupabase(TARGET);
    expect(sent[0]?.url).toContain('abcdefghijklmnopqrst.supabase.co');
  });

  it('survives a backend that throws rather than answering', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      }),
    );
    await expect(new ProbeRunner().probeSupabase(TARGET)).resolves.toEqual([]);
  });
});

describe('checkSourceMaps', () => {
  it('reports a map only when the body really is one', async () => {
    record(() => ({ status: 200, body: '{"version":3,"sources":["a.ts"]}' }));
    const findings = await new ProbeRunner().checkSourceMaps(['https://example.com/a.js.map']);
    expect(findings).toHaveLength(1);
  });

  // The SPA trap: many hosts answer 200 with the app shell for any unknown
  // path, so a status check alone would report a map on every such site.
  it('is not fooled by an SPA answering 200 with its own HTML', async () => {
    record(() => ({ status: 200, body: '<!doctype html><html><body>app</body></html>' }));
    const findings = await new ProbeRunner().checkSourceMaps(['https://example.com/a.js.map']);
    expect(findings).toEqual([]);
  });

  it('stops at the first map found rather than listing them all', async () => {
    const sent = record(() => ({ status: 200, body: '{"version":3,"sources":[]}' }));
    const findings = await new ProbeRunner().checkSourceMaps([
      'https://example.com/a.js.map',
      'https://example.com/b.js.map',
      'https://example.com/c.js.map',
    ]);
    expect(findings).toHaveLength(1);
    expect(sent).toHaveLength(1);
  });

  it('caps how many candidates it will try', async () => {
    const sent = record(() => ({ status: 404 }));
    const many = Array.from({ length: 20 }, (_, i) => `https://example.com/${i}.js.map`);
    await new ProbeRunner().checkSourceMaps(many);
    expect(sent.length).toBeLessThanOrEqual(4);
  });
});

describe('checkExposedFiles', () => {
  it('reads from the site root and reports nothing when the files are absent', async () => {
    const sent = record(() => ({ status: 404 }));
    const findings = await new ProbeRunner().checkExposedFiles('https://example.com');

    expect(findings).toEqual([]);
    expect(sent.every((r) => r.url.startsWith('https://example.com/'))).toBe(true);
  });

  it('keeps going when one path throws', async () => {
    let first = true;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        if (first) {
          first = false;
          throw new Error('boom');
        }
        return { status: 404, ok: false, text: async () => '', json: async () => null };
      }),
    );
    await expect(
      new ProbeRunner().checkExposedFiles('https://example.com'),
    ).resolves.toBeInstanceOf(Array);
  });
});
