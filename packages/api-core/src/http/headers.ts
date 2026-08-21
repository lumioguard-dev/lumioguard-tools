import type { Context, MiddlewareHandler } from 'hono';

/**
 * What every response from every tool's Worker carries. It was written out in
 * all three `index.ts` files identically, and a header added to two of the
 * three is one the third quietly does without.
 *
 * `x-robots-tag` is the one that is not merely hygiene: each Worker answers on
 * its own public origin, and `/api/scan?url=…` returns JSON about somebody
 * else's site. There is no document to put a meta tag in, so the header is the
 * only place to say it.
 */
export function standardHeaders(): MiddlewareHandler {
  return async (context: Context, next) => {
    await next();
    context.header('x-content-type-options', 'nosniff');
    context.header('referrer-policy', 'no-referrer');
    context.header('x-robots-tag', 'noindex, nofollow');
  };
}
