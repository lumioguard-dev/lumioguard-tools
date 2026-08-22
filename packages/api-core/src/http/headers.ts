import type { Context, MiddlewareHandler } from 'hono';

/**
 * What every Worker response carries, written once because three copies drift.
 * `x-robots-tag` is the load-bearing one: `/api/scan?url=…` returns JSON about
 * somebody else's site, and there is no document to put a meta tag in.
 */
export function standardHeaders(): MiddlewareHandler {
  return async (context: Context, next) => {
    await next();
    context.header('x-content-type-options', 'nosniff');
    context.header('referrer-policy', 'no-referrer');
    context.header('x-robots-tag', 'noindex, nofollow');
  };
}
