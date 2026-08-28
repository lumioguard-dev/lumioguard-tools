import { type RecorderConfig, recorderConfigFor } from '@lumioguard/api-core';
import type { Env } from '../http/env.js';

/**
 * Read per request rather than baked into the container: bindings arrive with
 * the request in Workers, and the container is built once per isolate.
 */
export function recorderConfigFrom(env: Env): RecorderConfig | null {
  return recorderConfigFor('slopmeter', env.SLOPMETER_INGEST_SECRET, env.LUMIOGUARD_API_BASE_URL);
}
