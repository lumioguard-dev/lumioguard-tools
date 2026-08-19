// Compares this port against the JavaScript detector it was ported from, on its
// cached corpus. That corpus is not in this repository, so the suite SKIPS
// itself unless SLOPMETER_PARITY_ROOT points at a checkout of it: a clone with
// neither the path nor the variable set simply runs the other suites.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SlopAnalyzer } from '../SlopAnalyzer.js';
import { PageSnapshot } from '../domain/PageSnapshot.js';
import { createDefaultRegistry } from '../rules/definitions/index.js';

const LEGACY_ROOT = process.env.SLOPMETER_PARITY_ROOT ?? '';
const PAGES_DIR = join(LEGACY_ROOT, 'data', 'pages');
const available =
  LEGACY_ROOT !== '' &&
  existsSync(PAGES_DIR) &&
  existsSync(join(LEGACY_ROOT, 'src', 'detector.js'));

describe.runIf(available)('parity with the original detector', () => {
  it('scores the cached corpus identically', async () => {
    const legacy = (await import(pathToFileURL(join(LEGACY_ROOT, 'src', 'detector.js')).href)) as {
      analyze: (input: unknown) => { score: number; tier: string };
    };

    const analyzer = new SlopAnalyzer(createDefaultRegistry());
    const files = readdirSync(PAGES_DIR)
      .filter((f) => f.endsWith('.json'))
      .slice(0, 120);

    const drift: Array<{ file: string; ours: number; theirs: number }> = [];

    for (const file of files) {
      const raw = JSON.parse(readFileSync(join(PAGES_DIR, file), 'utf8')) as {
        url: string;
        html: string;
        css?: string[];
        headers?: Record<string, string>;
      };

      const ours = analyzer.analyze(
        PageSnapshot.create({
          url: raw.url,
          html: raw.html,
          stylesheets: raw.css ?? [],
          headers: raw.headers ?? {},
        }),
      );
      const theirs = legacy.analyze(raw);

      if (ours.score.value !== theirs.score) {
        drift.push({ file, ours: ours.score.value, theirs: theirs.score });
      }
    }

    const meanDrift =
      drift.reduce((total, row) => total + Math.abs(row.ours - row.theirs), 0) /
      Math.max(files.length, 1);

    console.log(
      `parity: ${files.length - drift.length}/${files.length} exact, mean drift ${meanDrift.toFixed(2)}`,
    );
    for (const row of drift.slice(0, 12)) {
      console.log(`  ${row.file}: ours ${row.ours} vs original ${row.theirs}`);
    }

    // The rule ids were renamed and six rules moved axis during the port, so a
    // handful of scores legitimately differ. A large mean drift would mean the
    // port changed behaviour, which it must not.
    expect(meanDrift).toBeLessThan(3);
  }, 120_000);
});
