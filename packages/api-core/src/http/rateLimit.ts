export interface RateLimiter {
  limit(input: { readonly key: string }): Promise<{ readonly success: boolean }>;
}

/** Production abuse boundary. Unbound in tests and local forks, where it fails open. */
export async function allowedByRateLimit(
  limiter: RateLimiter | undefined,
  request: Request,
): Promise<boolean> {
  if (limiter === undefined) return true;
  const client = request.headers.get('cf-connecting-ip') ?? 'unknown';
  return (await limiter.limit({ key: client })).success;
}
