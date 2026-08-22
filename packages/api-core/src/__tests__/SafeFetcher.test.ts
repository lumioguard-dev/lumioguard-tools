import { describe, expect, it, vi } from 'vitest';
import { SafeFetcher, readText } from '../services/SafeFetcher.js';
import { InvalidTargetError } from '../services/TargetResolver.js';

describe('SafeFetcher', () => {
  it('validates every redirect before following it', async () => {
    const send = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/latest' } }),
      );
    await expect(
      new SafeFetcher(undefined, send).fetch('https://example.com'),
    ).rejects.toBeInstanceOf(InvalidTargetError);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('follows safe redirects manually and records their delivery', async () => {
    const send = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 301, headers: { location: '/final' } }))
      .mockResolvedValueOnce(new Response('ok'));
    const result = await new SafeFetcher(undefined, send).fetch('https://example.com/start');
    expect(result.url.toString()).toBe('https://example.com/final');
    expect(result.redirects).toBe(1);
    expect(send.mock.calls[0]?.[1]).toMatchObject({ redirect: 'manual' });
  });

  it('does not forward credentials across origins', async () => {
    const send = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(null, { status: 302, headers: { location: 'https://other.example/final' } }),
      )
      .mockResolvedValueOnce(new Response('ok'));
    await new SafeFetcher(undefined, send).fetch('https://example.com/start', {
      headers: { authorization: 'Bearer secret', apikey: 'published-key' },
    });
    const redirectedHeaders = new Headers(send.mock.calls[1]?.[1]?.headers);
    expect(redirectedHeaders.has('authorization')).toBe(false);
    expect(redirectedHeaders.has('apikey')).toBe(false);
  });
});

describe('readText', () => {
  it('stops at the byte ceiling', async () => {
    const result = await readText(new Response('abcdefghij'), 5);
    expect(result).toEqual({ text: 'abcde', truncated: true });
  });

  it('does not mark a shorter response as truncated', async () => {
    expect(await readText(new Response('abc'), 5)).toEqual({ text: 'abc', truncated: false });
  });

  it('does not mark a response exactly at the ceiling as truncated', async () => {
    expect(await readText(new Response('abcde'), 5)).toEqual({ text: 'abcde', truncated: false });
  });
});
