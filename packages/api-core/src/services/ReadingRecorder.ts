/**
 * Posting a finished reading to an ingest that verifies an HMAC.
 *
 * Shared because it was written twice, once per tool, and the two copies were
 * the SIGNING code: a correction to one could silently miss the other. What
 * genuinely differs between tools is four strings and the payload shape, so
 * those are arguments and everything else lives here once.
 *
 * **The far side mints the key, not this Worker.** A key has to be unique across
 * readings, and only the side holding the uniqueness constraint can hand out one
 * that is certainly free; a key minted here could collide on arrival, by which
 * time the response naming it has already gone out.
 */

/** A reading is a few kilobytes; the recorder should not hang on a slow API. */
const TIMEOUT_MS = 5000;

export interface RecorderConfig {
  readonly endpoint: string;
  readonly secret: string;
  /** Per tool, so a leak of one tool's secret cannot forge another's. */
  readonly signatureHeader: string;
  readonly timestampHeader: string;
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

  /**
   * A WRAPPER, not `globalThis.fetch` itself: Workers' fetch throws "Illegal
   * invocation" once detached from the global, and a field detaches it.
   * Injected so a test can assert what was sent without a network.
   */
  public constructor(send: ReadingTransport = (url, init) => fetch(url, init)) {
    this.send = send;
  }

  /**
   * The minted site key, or null when the reading could not be recorded.
   *
   * Never throws. Recording is the hand-off, not the reading: a failure here
   * costs the site key and nothing else, and the report still renders.
   */
  public async record(
    payload: unknown,
    config: RecorderConfig,
    host: string,
  ): Promise<string | null> {
    try {
      const body = JSON.stringify(payload);
      // Signed WITH a timestamp, and the ingest refuses a stale one: a
      // body-only signature never expires, so a captured request could be
      // replayed forever, minting a row every time.
      const sentAt = Math.floor(Date.now() / 1000);
      const signature = await hmacSha256Hex(config.secret, `${sentAt}.${body}`);

      const response = await this.send(config.endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          [config.signatureHeader]: signature,
          [config.timestampHeader]: String(sentAt),
        },
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) {
        // Status only: the body carries the other side's validation issues, and
        // this Worker's logs are not the place to accumulate another product's
        // internals.
        console.warn('[reading] rejected', { status: response.status, host });
        return null;
      }

      const key = siteKeyOf(await response.json());
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
 * Hex HMAC-SHA256 of `data` keyed by the hex-encoded `keyHex`.
 *
 * The key is hex-DECODED before import, mirroring the verifier: keying with the
 * UTF-8 bytes of the hex string instead produces a signature that is stable,
 * plausible, and rejected by every ingest.
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
