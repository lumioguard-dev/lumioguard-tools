// `URL` and `atob` exist in both Workers and Node, but TypeScript ships them
// only in the `DOM` lib, which would also hand this package a `document` and a
// `window` it must never touch.

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

/** Base64 decode: used to read a JWT payload without a crypto dependency. */
declare function atob(data: string): string;
