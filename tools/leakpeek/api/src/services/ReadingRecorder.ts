import type { ExposureResponse } from '@lumioguard/shared';
import type { Env } from '../http/env.js';

/** Records a reading with LumioGuard and returns the handle it was filed under. */

/** A reading is a few kilobytes; the recorder should not hang on a slow API. */
const TIMEOUT_MS = 5000;

export interface RecorderConfig {
  readonly endpoint: string;
  readonly secret: string;
}

/**
 * Read per request: bindings arrive with the request, the container does not.
 *
 * Both halves are required and neither has a default: a fork that sets a secret
 * but no address must not post its readings to somebody else's API.
 */
export function recorderConfigFrom(env: Env): RecorderConfig | null {
  const secret = env.LEAKPEEK_INGEST_SECRET;
  const base = env.LUMIOGUARD_API_BASE_URL?.replace(/\/$/, '');
  if (!secret || !base) return null;
  // One intake for every reading tool; the tool is named in the path.
  return { endpoint: `${base}/api/external/leakpeek/readings`, secret };
}

/** Narrowed to one signed POST so a test can supply a double without a cast. */
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

/**
 * The wire LumioGuard's ingest validates. `findings` is the envelope every tool
 * speaks; `payload` is what only this tool's surfaces read.
 */
export interface ReadingPayload {
  readonly entryUrl: string;
  readonly host: string;
  readonly score: number;
  readonly tier: string;
  readonly tierDescription: string;
  readonly headline: string | null;
  readonly findings: ReadonlyArray<{
    readonly severity: string;
    readonly title: string;
    readonly detail: string;
    readonly evidence: string | null;
  }>;
  readonly payload: {
    readonly backendProbed: boolean;
    readonly stack: {
      readonly builder: string | null;
      readonly backend: string | null;
      readonly hosting: string | null;
    };
  };
}

/**
 * Field-by-field, not a spread: a spread would carry `scannedAt` and each
 * finding's opaque `id` across a boundary with no use for them, and would
 * forward whatever is added to the wire later.
 */
export function readingFrom(report: ExposureResponse): ReadingPayload {
  return {
    entryUrl: report.url,
    host: report.host,
    score: report.score,
    tier: report.tier,
    tierDescription: report.tierDescription,
    headline: report.headline,
    findings: report.findings.map((finding) => ({
      severity: finding.severity,
      title: finding.title,
      detail: finding.detail,
      evidence: finding.evidence,
    })),
    payload: {
      backendProbed: report.backendProbed,
      stack: {
        builder: report.stack.builder,
        backend: report.stack.backend,
        hosting: report.stack.hosting,
      },
    },
  };
}

export class ReadingRecorder {
  private readonly send: ReadingTransport;

  /**
   * A WRAPPER, not `globalThis.fetch` itself: Workers' fetch throws "Illegal
   * invocation" once detached from the global, and a field detaches it.
   */
  public constructor(send: ReadingTransport = (url, init) => fetch(url, init)) {
    this.send = send;
  }

  /** The minted site key, or null when the reading could not be recorded. */
  public async record(report: ExposureResponse, config: RecorderConfig): Promise<string | null> {
    const host = report.host;
    try {
      const body = JSON.stringify(readingFrom(report));
      // Signed WITH a timestamp, and LumioGuard refuses a stale one: a
      // body-only signature never expires, so a captured request could be
      // replayed forever.
      const sentAt = Math.floor(Date.now() / 1000);
      const signature = await hmacSha256Hex(config.secret, `${sentAt}.${body}`);

      const response = await this.send(config.endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-leakpeek-signature': signature,
          'x-leakpeek-timestamp': String(sentAt),
        },
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) {
        // Status only: their validation issues are not this Worker's to log.
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

/** Narrowed, not trusted: this is about to be printed into an href. */
function siteKeyOf(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null || !('siteKey' in payload)) return null;
  const value: unknown = payload.siteKey;
  return typeof value === 'string' && value !== '' ? value : null;
}

/**
 * Mirrors @lumioguard/crypto's hmacSha256Hex, which verifies this: the key is
 * hex-DECODED before import, so keying with the UTF-8 of the hex string fails.
 */
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
