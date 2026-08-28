// Set ONE version across every workspace package.json. The repo ships as a single
// version: the Release workflow reads it to tag, then bumps it here.

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Read from pnpm-workspace.yaml rather than a second hardcoded list. The list
 * WAS hardcoded, as `<dir>/api|web|core`, which expanded to `tools/api` and
 * left every tool and the console behind at the version before last.
 */
function workspaceGlobs() {
  const yaml = readFileSync(join(ROOT, 'pnpm-workspace.yaml'), 'utf8');
  return [...yaml.matchAll(/^\s*-\s*["']([^"']+)["']/gm)].map((match) => match[1]);
}

function expand(pattern) {
  let dirs = [''];
  for (const part of pattern.split('/')) {
    const next = [];
    for (const dir of dirs) {
      if (part !== '*') {
        const candidate = dir === '' ? part : `${dir}/${part}`;
        if (existsSync(join(ROOT, candidate))) next.push(candidate);
        continue;
      }
      const base = join(ROOT, dir);
      if (!existsSync(base)) continue;
      for (const name of readdirSync(base)) {
        if (name.startsWith('.') || name === 'node_modules') continue;
        if (statSync(join(base, name)).isDirectory())
          next.push(dir === '' ? name : `${dir}/${name}`);
      }
    }
    dirs = next;
  }
  return dirs;
}

function workspacePackageJsons() {
  const dirs = ['.', ...workspaceGlobs().flatMap(expand)];
  return dirs.map((dir) => join(ROOT, dir, 'package.json')).filter((path) => existsSync(path));
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
