import { InvalidTargetError, TargetResolver } from './TargetResolver.js';

const REDIRECTS = new Set([301, 302, 303, 307, 308]);

export interface SafeFetchResult {
  readonly response: Response;
  readonly url: URL;
  readonly redirects: number;
  readonly temporaryRedirect: boolean;
}

export class SafeFetcher {
  public constructor(
    private readonly resolver = new TargetResolver(),
    private readonly send: typeof fetch = (input, init) => fetch(input, init),
  ) {}

  public async fetch(
    input: string | URL,
    init: RequestInit = {},
    maxRedirects = 5,
  ): Promise<SafeFetchResult> {
    let url = this.resolver.resolve(String(input));
    let requestInit = init;
    let redirects = 0;
    let temporaryRedirect = false;
    for (;;) {
      const response = await this.send(url.toString(), { ...requestInit, redirect: 'manual' });
      if (!REDIRECTS.has(response.status)) return { response, url, redirects, temporaryRedirect };
      const location = response.headers.get('location');
      if (location === null) return { response, url, redirects, temporaryRedirect };
      if (redirects >= maxRedirects) throw new InvalidTargetError('Too many redirects');
      temporaryRedirect ||= response.status === 302 || response.status === 307;
      redirects += 1;
      const next = this.resolver.resolve(new URL(location, url).toString());
      if (next.origin !== url.origin) requestInit = withoutCredentials(requestInit);
      url = next;
    }
  }
}

function withoutCredentials(init: RequestInit): RequestInit {
  const headers = new Headers(init.headers);
  headers.delete('authorization');
  headers.delete('proxy-authorization');
  headers.delete('cookie');
  headers.delete('apikey');
  return { ...init, headers };
}

export async function readText(
  response: Response,
  maxBytes: number,
): Promise<{ text: string; truncated: boolean }> {
  if (response.body === null) return { text: '', truncated: false };
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let bytes = 0;
  let truncated = false;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const remaining = maxBytes - bytes;
      if (value.byteLength > remaining) {
        text += decoder.decode(value.subarray(0, Math.max(0, remaining)), { stream: true });
        truncated = true;
        await reader.cancel();
        break;
      }
      bytes += value.byteLength;
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
  return { text: text + decoder.decode(), truncated };
}
