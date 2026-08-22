import { describe, expect, it, vi } from 'vitest';
import { allowedByRateLimit } from '../http/rateLimit.js';

describe('allowedByRateLimit', () => {
  it('fails open when a local fork has no binding', async () => {
    await expect(allowedByRateLimit(undefined, new Request('https://example.com'))).resolves.toBe(
      true,
    );
  });

  it('keys the platform limiter by the connecting client', async () => {
    const limit = vi.fn(async () => ({ success: false }));
    const request = new Request('https://example.com', {
      headers: { 'cf-connecting-ip': '203.0.113.8' },
    });
    await expect(allowedByRateLimit({ limit }, request)).resolves.toBe(false);
    expect(limit).toHaveBeenCalledWith({ key: '203.0.113.8' });
  });
});
