// `URL` exists in both Workers and Node, but TypeScript ships it only in the
// `DOM` lib, which would also hand this package a `document` and a `window` it
// must never touch.

declare class URLSearchParams {
  keys(): IterableIterator<string>;
  delete(name: string): void;
  get(name: string): string | null;
  has(name: string): boolean;
  set(name: string, value: string): void;
  toString(): string;
}

declare class URL {
  constructor(input: string, base?: string | URL);
  hash: string;
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
