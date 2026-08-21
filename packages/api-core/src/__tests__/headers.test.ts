import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { standardHeaders } from '../http/headers.js';

/**
 * What every Worker response carries. The failure this guards is silent:
 * nothing breaks, no response looks wrong, and a header added to two of the
 * three Workers is one the third quietly does without.
 */

// `app.request` may answer synchronously, so it is awaited rather than
// returned: its type is `Response | Promise<Response>` and only one of those
// has headers to read without unwrapping.
async function respond(): Promise<Response> {
  const app = new Hono();
  app.use('*', standardHeaders());
  app.get('/api/scan', (context) => context.json({ ok: true }));
  return await app.request('/api/scan');
}

describe('standardHeaders', () => {
  it('keeps every reading out of a search index', async () => {
    // `/api/scan?url=…` returns JSON about somebody ELSE's site. Indexed, those
    // are pages about other people's domains published under ours.
    const headers = (await respond()).headers;
    expect(headers.get('x-robots-tag')).toBe('noindex, nofollow');
  });

  it('refuses to let a response be read as a type it did not declare', async () => {
    expect((await respond()).headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('sends no referrer, because the URL carries the site somebody asked about', async () => {
    expect((await respond()).headers.get('referrer-policy')).toBe('no-referrer');
  });

  it('leaves the body alone', async () => {
    expect(await (await respond()).json()).toEqual({ ok: true });
  });
});
