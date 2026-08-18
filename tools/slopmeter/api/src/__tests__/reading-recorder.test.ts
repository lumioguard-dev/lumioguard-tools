import { createHmac } from 'node:crypto';
import type { CrawlResponse } from '@lumioguard/shared';
import { describe, expect, it, vi } from 'vitest';
import {
  ReadingRecorder,
  type ReadingTransport,
  recorderConfigFrom,
} from '../services/ReadingRecorder.js';

/** 32-byte hex, the shape the deployed secret takes. */
const SECRET = 'a1b2c3d4e5f6071829304a5b6c7d8e9f0112233445566778899aabbccddeeff0';

const CONFIG = { endpoint: 'https://api.test/api/external/slopmeter/readings', secret: SECRET };

function report(overrides: Partial<CrawlResponse> = {}): CrawlResponse {
  return {
    entry: 'https://www.example.com/pricing',
    pagesScanned: 12,
    maxDepthReached: 2,
    requestedDepth: 2,
    requestedMaxPages: 15,
    site: {
      score: 61,
      tier: 'Pure Slop',
      tierDescription: 'Stock everything. The template is still showing.',
      headline: 'placeholder Latin still in the copy',
      method: 'max(homepage, median)',
      homepageScore: 61,
      medianPageScore: 54,
      meanPageScore: 55,
      worstPage: null,
      hiddenSignals: 0,
      hiddenWeight: 0,
      hiddenDelta: null,
      uniqueSignals: 3,
    },
    signals: [],
    pages: [],
    errors: [],
    screenshotUrl: null,
    siteKey: null,
    fetchedAt: '2026-08-14T00:00:00.000Z',
    ...overrides,
  };
}

function signal(label: string, weight: number) {
  return { id: 's0', label, weight, evidence: null, pages: 1, firstSeen: 'x', onHomepage: true };
}

/** Capture what the recorder sent, and answer with a minted key. */
function captor(options: { status?: number; body?: unknown } = {}) {
  const status = options.status ?? 200;
  // `in` rather than `??`: one of the cases below is a body that IS null, and a
  // nullish default would quietly answer it with a valid key instead.
  const payload: unknown = 'body' in options ? options.body : { siteKey: 'K7M2XQ' };
  const calls: Array<{ url: string; headers: Record<string, string>; body: string }> = [];
  const send: ReadingTransport = async (url, init) => {
    calls.push({ url, headers: init.headers, body: init.body });
    return { ok: status >= 200 && status < 300, status, json: async () => payload };
  };
  return { calls, send };
}

describe('recorderConfigFrom', () => {
  it('is off without a secret, so an unconfigured environment records nothing', () => {
    expect(recorderConfigFrom({})).toBeNull();
  });

  it('is off with a secret but no address, so a fork cannot post to another API', () => {
    expect(recorderConfigFrom({ SLOPMETER_INGEST_SECRET: SECRET })).toBeNull();
  });

  it('is off with an address but no secret, so nothing is ever posted unsigned', () => {
    expect(recorderConfigFrom({ LUMIOGUARD_API_BASE_URL: 'https://api.test' })).toBeNull();
  });

  it('tolerates a base URL with a trailing slash rather than doubling it', () => {
    const config = recorderConfigFrom({
      SLOPMETER_INGEST_SECRET: SECRET,
      LUMIOGUARD_API_BASE_URL: 'https://api.test/',
    });
    expect(config?.endpoint).toBe('https://api.test/api/external/slopmeter/readings');
  });
});

describe('the recorded reading', () => {
  it('returns the key LumioGuard minted', async () => {
    const { send } = captor();
    await expect(new ReadingRecorder(send).record(report(), CONFIG)).resolves.toBe('K7M2XQ');
  });

  // The key identifies a READING and only the side holding the uniqueness
  // constraint can mint one that is certainly free. Sending a key from here
  // would be this Worker guessing at that.
  it('sends no key of its own', async () => {
    const { calls, send } = captor();
    await new ReadingRecorder(send).record(report(), CONFIG);

    expect(JSON.parse(calls[0]?.body ?? '{}')).not.toHaveProperty('siteKey');
  });

  it('signs the timestamp with the body, keyed by the hex-DECODED secret', async () => {
    const { calls, send } = captor();
    await new ReadingRecorder(send).record(report(), CONFIG);

    const sent = calls[0];
    expect(sent).toBeDefined();
    if (!sent) return;

    const timestamp = sent.headers['x-slopmeter-timestamp'];
    expect(timestamp).toMatch(/^\d+$/);

    // Computed independently, the way LumioGuard verifies it: the secret is
    // hex-decoded to raw bytes BEFORE it keys the HMAC, and the signed material
    // is `timestamp.body`. Keying with the UTF-8 of the hex string verifies here
    // and fails every real ingest; signing the body alone never expires.
    const expected = createHmac('sha256', Buffer.from(SECRET, 'hex'))
      .update(`${timestamp}.${sent.body}`)
      .digest('hex');
    expect(sent.headers['x-slopmeter-signature']).toBe(expected);
  });

  it('reports the host, not the scanned path', async () => {
    const { calls, send } = captor();
    await new ReadingRecorder(send).record(report(), CONFIG);

    const body = JSON.parse(calls[0]?.body ?? '{}');
    // www is not a different site, and the entry was a deep link.
    expect(body.host).toBe('example.com');
    expect(body.entryUrl).toBe('https://www.example.com/pricing');
    expect(body.score).toBe(61);
    expect(body.tier).toBe('Pure Slop');
  });

  it('sends the heaviest tells first and no more than ten', async () => {
    const many = Array.from({ length: 25 }, (_, i) => signal(`tell ${i}`, i));
    const { calls, send } = captor();
    await new ReadingRecorder(send).record(report({ signals: many }), CONFIG);

    const body = JSON.parse(calls[0]?.body ?? '{}');
    expect(body.payload.signals).toHaveLength(10);
    expect(body.payload.signals[0].weight).toBe(24);
    // The common envelope is capped and ordered with them.
    expect(body.findings).toHaveLength(10);
    expect(body.payload.signals[9].weight).toBe(15);
  });

  // The rule pack is the product and never crosses Slopmeter's own wire; it
  // must not reach another service's database either.
  it('carries no rule identity', async () => {
    const { calls, send } = captor();
    await new ReadingRecorder(send).record(
      report({ signals: [signal('Lorem ipsum', 22)] }),
      CONFIG,
    );

    const body = calls[0]?.body ?? '';
    expect(body).not.toContain('ruleId');
    expect(body).not.toContain('category');
    expect(JSON.parse(body).payload.signals[0]).not.toHaveProperty('id');
    expect(JSON.parse(body).findings[0]).not.toHaveProperty('id');
  });
});

describe('what a failed recording costs', () => {
  // A reading that could not be recorded costs the hand-off and nothing else:
  // the report still renders, and the audit link goes to the front door.
  it('answers null when the request is rejected', async () => {
    const send: ReadingTransport = async () => {
      throw new Error('econnrefused');
    };

    await expect(new ReadingRecorder(send).record(report(), CONFIG)).resolves.toBeNull();
  });

  it('answers null when the API refuses the reading', async () => {
    const { send } = captor({ status: 400 });

    await expect(new ReadingRecorder(send).record(report(), CONFIG)).resolves.toBeNull();
  });

  // About to be printed into an href, so a shape change upstream must cost the
  // hand-off rather than render '[object Object]' into a link.
  const malformed: ReadonlyArray<readonly [unknown, string]> = [
    [{}, 'no key at all'],
    [{ siteKey: '' }, 'an empty key'],
    [{ siteKey: { oops: true } }, 'a key that is not a string'],
    [null, 'a null body'],
  ];
  it.each(malformed)('answers null for %s (%s)', async (body) => {
    const { send } = captor({ body });

    await expect(new ReadingRecorder(send).record(report(), CONFIG)).resolves.toBeNull();
  });

  it('logs the status and the host, and nothing else', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { send } = captor({ status: 400 });

    await new ReadingRecorder(send).record(report(), CONFIG);

    expect(warn).toHaveBeenCalledWith('[reading] rejected', { status: 400, host: 'example.com' });
    warn.mockRestore();
  });
});
