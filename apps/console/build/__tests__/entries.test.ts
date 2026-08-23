import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CATALOGUE, SCAN_SLUG } from '../../src/tools/catalogue.js';

const ROOT = new URL('../../', import.meta.url);

/** Normalised, because Windows checks these out CRLF and the build does not care. */
function read(name: string): string {
  return readFileSync(fileURLToPath(new URL(name, ROOT)), 'utf8').replace(/\r\n/g, '\n');
}

const ENTRIES = [
  'index.html',
  `${SCAN_SLUG}.html`,
  ...CATALOGUE.map((tool) => `${tool.slug}.html`),
];

describe('the entry documents', () => {
  it('is one per page, and no more', () => {
    // `vite.config.ts` builds its input map from the catalogue, so a reading
    // added without its document fails deep inside Rollup with a missing path.
    const onDisk = readdirSync(fileURLToPath(ROOT)).filter((name) => name.endsWith('.html'));
    expect(onDisk.sort()).toEqual([...ENTRIES].sort());
  });

  it('keeps every one identical to the index', () => {
    // They differ by filename only: `transformIndexHtml` reads the path to pick
    // the title, the canonical and the shell. Editing the head into one of them
    // by hand would ship five documents with different chrome and no error.
    const index = read('index.html');
    for (const name of ENTRIES) expect(read(name), name).toBe(index);
  });
});
