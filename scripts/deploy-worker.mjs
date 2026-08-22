// Deploy a tool's Worker: node ../../scripts/deploy-worker.mjs slopmeter
//
// The vars below name hosts only this deployment owns, and the repo is public,
// so they come from the environment rather than wrangler.toml. Unset means not
// passed, and production's own default blocks every origin.

import { spawn } from 'node:child_process';

const tool = process.argv[2];
if (!tool) {
  console.error('usage: deploy-worker.mjs <tool>');
  process.exit(1);
}

/** Taken from the deploy, not the repo. */
const PASSED = ['ALLOWED_ORIGINS', 'LUMIOGUARD_API_BASE_URL'];

const args = ['deploy', '--env', 'production'];
const missing = [];

for (const name of PASSED) {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    missing.push(name);
    continue;
  }
  args.push('--var', `${name}:${value}`);
}

if (missing.length > 0) {
  console.warn(
    `[deploy] ${tool}: ${missing.join(', ')} not set, so wrangler.toml decides. On this project they are repository variables; a fork sets its own.`,
  );
}

// `shell: true` so this resolves wrangler from the package's own node_modules
// bin on Windows, where the bin is a .cmd shim rather than an executable.
const child = spawn('wrangler', args, { stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code ?? 1));
