import { ErrorCode } from '@lumioguard/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApiClient, ScanApiError } from '../api/ApiClient.js';

/**
 * The one place a response crosses from the network into the app.
 *
 * Everything here guards the same failure: a shape nobody checked becoming
 * `undefined` three components deep, where the cause is invisible. Validation
 * belongs at this boundary and never below it.
 */

const bodySchema = z.object({ score: z.number(), tier: z.string() });

class TestClient extends ApiClient {
  public scan(body: unknown, signal?: AbortSignal) {
    return this.post('/api/scan', body, bodySchema, signal);
  }
}

function respondWith(status: number, payload: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => payload,
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ApiClient: the happy path', () => {
  it('returns the parsed body', async () => {
    respondWith(200, { score: 60, tier: 'Wide Open' });
    await expect(new TestClient('').scan({ url: 'example.com' })).resolves.toEqual({
      score: 60,
      tier: 'Wide Open',
    });
  });

  it('posts JSON to the base URL it was given', async () => {
    respondWith(200, { score: 1, tier: 'Sealed' });
    await new TestClient('https://api.example.com').scan({ url: 'example.com' });

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call?.[0]).toBe('https://api.example.com/api/scan');
    expect(call?.[1]).toMatchObject({ method: 'POST' });
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({ url: 'example.com' });
  });

  // A trailing slash in a configured origin would otherwise produce
  // `https://api.example.com//api/scan`, which some hosts answer with a 301 that
  // drops the POST body.
  it('tolerates a trailing slash on the base URL rather than doubling it', async () => {
    respondWith(200, { score: 1, tier: 'Sealed' });
    await new TestClient('https://api.example.com/').scan({ url: 'example.com' });
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe('https://api.example.com/api/scan');
  });

  it('uses a relative path when no origin is configured, so Vite can proxy it', async () => {
    respondWith(200, { score: 1, tier: 'Sealed' });
    await new TestClient('').scan({ url: 'example.com' });
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe('/api/scan');
  });

  it('passes the abort signal through, so a superseded scan can be cancelled', async () => {
    respondWith(200, { score: 1, tier: 'Sealed' });
    const controller = new AbortController();
    await new TestClient('').scan({ url: 'example.com' }, controller.signal);
    expect(vi.mocked(fetch).mock.calls[0]?.[1]?.signal).toBe(controller.signal);
  });
});

describe('ApiClient: failures', () => {
  it('surfaces the API’s own code and message when the envelope parses', async () => {
    respondWith(400, {
      error: { code: ErrorCode.InvalidTarget, message: 'That host is not reachable' },
    });
    await expect(new TestClient('').scan({})).rejects.toMatchObject({
      code: ErrorCode.InvalidTarget,
      message: 'That host is not reachable',
    });
  });

  // The regression this exists for: the envelope was read behind a cast, so an
  // error answered in some other shape became `undefined` and reached the
  // visitor as the generic fallback instead of its own message.
  it('falls back generically when a failure body is NOT the envelope', async () => {
    respondWith(500, { oops: true });
    await expect(new TestClient('').scan({})).rejects.toMatchObject({
      code: ErrorCode.RequestFailed,
    });
  });

  it('falls back generically when a failure body is not JSON at all', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 502,
        json: async () => {
          throw new SyntaxError('not json');
        },
      })),
    );
    await expect(new TestClient('').scan({})).rejects.toBeInstanceOf(ScanApiError);
  });

  it('rejects a 200 whose body is the wrong shape, rather than passing it on', async () => {
    respondWith(200, { score: 'sixty', tier: 'Wide Open' });
    await expect(new TestClient('').scan({})).rejects.toMatchObject({
      code: ErrorCode.BadResponse,
    });
  });

  it('rejects a 200 with a missing field', async () => {
    respondWith(200, { score: 60 });
    await expect(new TestClient('').scan({})).rejects.toMatchObject({
      code: ErrorCode.BadResponse,
    });
  });

  it('always throws ScanApiError, so callers have one type to catch', async () => {
    respondWith(200, null);
    await expect(new TestClient('').scan({})).rejects.toBeInstanceOf(ScanApiError);
  });
});
