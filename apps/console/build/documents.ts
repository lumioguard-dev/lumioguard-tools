import { CATALOGUE, type ConsolePage, SCAN_SLUG, leaderboardPath } from '../src/tools/catalogue.js';

/**
 * One document per reading, all written from ONE `index.html`. A host rewrite
 * serves one file at every URL, so they would share a title and a canonical and
 * none of them could rank.
 */
export interface ConsoleDocument {
  readonly file: string;
  readonly url: string;
}

export const DOCUMENTS: readonly ConsoleDocument[] = [
  { file: 'index.html', url: '/' },
  { file: `${SCAN_SLUG}.html`, url: `/${SCAN_SLUG}` },
  ...CATALOGUE.map((tool) => ({ file: `${tool.slug}.html`, url: `/${tool.slug}` })),
  // `<path>.html`, NOT `<path>/index.html`: Cloudflare Pages answers `/path`
  // from the first with a 200 and from the second with a 308 to `/path/`,
  // pointing every canonical and link at a URL that moves.
  { file: `${leaderboardPath().replace(/^\//, '')}.html`, url: leaderboardPath() },
];

export function documentFor(pathname: string): ConsoleDocument | undefined {
  const wanted = pathname.replace(/\/+$/, '') || '/';
  return DOCUMENTS.find((document) => document.url === wanted);
}

export type { ConsolePage };
