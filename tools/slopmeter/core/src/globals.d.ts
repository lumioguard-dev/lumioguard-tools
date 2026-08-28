// `URL` is a WHATWG global TypeScript ships only in the `DOM` lib, and pulling
// `DOM` in would hand every rule a `document` and `window` this package must
// never touch, so the globals it genuinely needs are declared here instead.

declare class URLSearchParams {
  get(name: string): string | null;
  has(name: string): boolean;
  set(name: string, value: string): void;
  delete(name: string): void;
  keys(): IterableIterator<string>;
  toString(): string;
}

declare class URL {
  constructor(input: string, base?: string | URL);
  hash: string;
  /** Hostname with the port, where there is one. */
  host: string;
  hostname: string;
  href: string;
  origin: string;
  password: string;
  pathname: string;
  port: string;
  protocol: string;
  search: string;
  searchParams: URLSearchParams;
  username: string;
  toString(): string;
}
