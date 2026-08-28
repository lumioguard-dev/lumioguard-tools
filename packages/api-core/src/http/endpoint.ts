import { ErrorCode } from '@lumioguard/shared';
import type { Context, HonoRequest } from 'hono';
import type { z } from 'zod';

/**
 * `object`, not `Record<string, unknown>`: a Worker's Env is an interface, and an
 * interface has no index signature, so it does not satisfy that Record. The
 * constraint silently failed and every handler fell back to the default.
 */
type AnyEnv = object;

/**
 * Takes the REQUEST, not the whole context. Passing the context dragged the env
 * into this type, and Hono's Context is invariant, so every handler typed against
 * its own bindings became unassignable.
 */
export type RequestReader = (req: HonoRequest) => Promise<unknown> | unknown;

export const jsonBody: RequestReader = (req) => req.json().catch(() => ({}));

/** Every route validates and fails its input the same way. */
export function endpoint<Schema extends z.ZodTypeAny, Env extends AnyEnv = AnyEnv>(
  schema: Schema,
  read: RequestReader,
  run: (input: z.infer<Schema>, context: Context<{ Bindings: Env }>) => Promise<unknown> | unknown,
): (context: Context<{ Bindings: Env }>) => Promise<Response> {
  return async (context) => {
    const parsed = schema.safeParse(await read(context.req));
    if (!parsed.success) {
      return context.json(
        {
          error: {
            code: ErrorCode.InvalidRequest,
            message: parsed.error.issues[0]?.message ?? 'Invalid request',
          },
        },
        400,
      );
    }
    return context.json(await run(parsed.data, context));
  };
}
