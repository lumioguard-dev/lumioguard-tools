// `URL`/`atob` are WHATWG globals present in both Workers and Node, but
// TypeScript ships them only in the `DOM` lib. Pulling in `DOM` would also hand
// this package a `document` and `window` it must never touch, so the globals it
// genuinely needs are declared here instead.

declare class URLSearchParams {
  get(name: string): string | null;
  has(name: string): boolean;
  set(name: string, value: string): void;
  toString(): string;
}

declare class URL {
  constructor(input: string, base?: string | URL);
  host: string;
  hostname: string;
  href: string;
  origin: string;
  pathname: string;
  protocol: string;
  search: string;
  searchParams: URLSearchParams;
  toString(): string;
}

/** Base64 decode — used to read a JWT payload without a crypto dependency. */
declare function atob(data: string): string;
