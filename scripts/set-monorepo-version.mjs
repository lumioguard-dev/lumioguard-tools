// Set ONE version across every workspace package.json. The repo ships as a
// single version: the Release workflow reads it to tag, then bumps it here for
// the next cycle.
//
//   node scripts/set-monorepo-version.mjs <version>   set every workspace
//   node scripts/set-monorepo-version.mjs --print     print the current version
//
// The directories mirror the globs in pnpm-workspace.yaml — `packages/*` plus
// each tool's `api`/`web`/`core`. Read from the same shape rather than a second
// hardcoded list, so adding a tool needs no edit here either.
//
// Only the top-level "version" string is rewritten, no reformatting, so the diff
// is one line per file.

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOOL_LAYERS = ['api', 'web', 'core'];
const SKIP = new Set(['node_modules', 'packages', 'scripts', 'docs', '.git', '.github']);

function workspacePackageJsons() {
  const dirs = ['.'];

  const packages = join(ROOT, 'packages');
  if (existsSync(packages)) {
    for (const name of readdirSync(packages)) dirs.push(`packages/${name}`);
  }

  for (const name of readdirSync(ROOT)) {
    if (SKIP.has(name) || name.startsWith('.')) continue;
    if (!statSync(join(ROOT, name)).isDirectory()) continue;
    for (const layer of TOOL_LAYERS) dirs.push(`${name}/${layer}`);
  }

  return dirs.map((d) => join(ROOT, d, 'package.json')).filter((p) => existsSync(p));
}

function rootVersion() {
  return JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
}

const arg = process.argv[2];

if (arg === '--print') {
  process.stdout.write(`${rootVersion()}\n`);
} else {
  const version = arg;
  if (!version || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/.test(version)) {
    console.error(`Usage: set-monorepo-version <semver>  (got: ${version ?? '<none>'})`);
    process.exit(1);
  }
  let changed = 0;
  for (const path of workspacePackageJsons()) {
    const before = readFileSync(path, 'utf8');
    const after = before.replace(/("version":\s*)"[^"]*"/, `$1"${version}"`);
    if (after !== before) {
      writeFileSync(path, after);
      changed += 1;
    }
  }
  console.log(`Set ${changed} package.json file(s) to ${version}.`);
}
