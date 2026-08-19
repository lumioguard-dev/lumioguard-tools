import type { RecorderConfig } from '@lumioguard/api-core';
import type { Env } from '../http/env.js';

/**
 * What is Slopmeter's about recording a reading. The signing, the transport and
 * the response handling are one implementation in `@lumioguard/api-core`,
 * because they were written twice and the two copies were the signing code.
 */

/**
 * The recorder's settings, or null when recording is switched off.
 *
 * Both halves are required and neither has a default: a fork that sets a secret
 * but no address must not post its readings to somebody else's API.
 *
 * Read per request rather than baked into the container: bindings arrive with
 * the request in Workers, and the container is built once per isolate.
 */
export function recorderConfigFrom(env: Env): RecorderConfig | null {
  const secret = env.SLOPMETER_INGEST_SECRET;
  const base = env.LUMIOGUARD_API_BASE_URL?.replace(/\/$/, '');
  if (!secret || !base) return null;
  return {
    // One intake for every reading tool; the tool is named in the path.
    endpoint: `${base}/api/external/slopmeter/readings`,
    secret,
    signatureHeader: 'x-slopmeter-signature',
    timestampHeader: 'x-slopmeter-timestamp',
  };
}
