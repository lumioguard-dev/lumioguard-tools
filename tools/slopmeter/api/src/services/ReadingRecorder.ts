import { type CrawlResponse, hostOf } from '@lumioguard/shared';
import type { Env } from '../http/env.js';
import { readingFrom } from '../mappers/ReadingMapper.js';

/**
 * **LumioGuard mints the key, not this Worker.** The key has to be unique
 * across readings, and only the side holding the uniqueness constraint can
 * guarantee that — a key minted here could collide on arrival, and by then
 * the response naming it has already gone out.
 */

/** A reading is a few kilobytes; the recorder should not hang on a slow API. */
const TIMEOUT_MS = 5000;

export interface RecorderConfig {
  readonly endpoint: string;
  readonly secret: string;
}

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
  // One intake for every reading tool; the tool is named in the path.
  return { endpoint: `${base}/api/external/slopmeter/readings`, secret };
}

/** The slice of `fetch` this needs, and no more. */
export type ReadingTransport = (
  url: string,
  init: {
    readonly method: string;
    readonly headers: Record<string, string>;
    readonly body: string;
    readonly signal?: AbortSignal;
  },
) => Promise<{
  readonly ok: boolean;
  readonly status: number;
  readonly json: () => Promise<unknown>;
}>;

export class ReadingRecorder {
  private readonly send: ReadingTransport;

  /** Injected so a test can assert what was sent without a network. */
  public constructor(send: ReadingTransport = (url, init) => fetch(url, init)) {
    this.send = send;
  }

  /** The minted site key, or null when the reading could not be recorded. */
  public async record(report: CrawlResponse, config: RecorderConfig): Promise<string | null> {
    const host = hostOf(report.entry);
    try {
      const body = JSON.stringify(readingFrom(report, host));
      // Signed WITH a timestamp, and LumioGuard refuses a stale one: a
      // body-only signature never expires, so a captured request could be
      // replayed forever.
      const sentAt = Math.floor(Date.now() / 1000);
      const signature = await hmacSha256Hex(config.secret, `${sentAt}.${body}`);

      const response = await this.send(config.endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-slopmeter-signature': signature,
          'x-slopmeter-timestamp': String(sentAt),
        },
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) {
        // Status only. The body carries LumioGuard's validation issues, and
        // this Worker's logs are not the place to accumulate another product's
        // internals.
        console.warn('[reading] rejected', { status: response.status, host });
        return null;
      }

      const payload: unknown = await response.json();
      const key = siteKeyOf(payload);
      if (key === null) console.warn('[reading] recorded without a usable key', { host });
      return key;
    } catch (error) {
      console.warn('[reading] not recorded', {
        host,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }
}

/** Read the minted key out of the ingest response. */
function siteKeyOf(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null || !('siteKey' in payload)) return null;
  const value: unknown = payload.siteKey;
  return typeof value === 'string' && value !== '' ? value : null;
}

/** Hex HMAC-SHA256 of `data` keyed by the hex-encoded `keyHex`. */
async function hmacSha256Hex(keyHex: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    hexToBytes(keyHex),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
