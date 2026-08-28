// The Worker's port and the web app's proxy target come from one row in
// ports.json, and both bind the host stated there: wrangler defaults to 127.0.0.1
// and Vite to ::1, which left the two halves of one tool on different IP stacks.

import { spawn } from 'node:child_process';
import { HOST, portsFor } from './ports.mjs';

const tool = process.argv[2];
if (!tool) {
  console.error('usage: dev-worker.mjs <tool>');
  process.exit(1);
}

let port;
let inspector;
try {
  ({ api: port, inspector } = portsFor(tool));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

console.log(`[ports] ${tool} api → http://${HOST}:${port} (inspector ${inspector})`);

// `shell: true` resolves wrangler from the package's own node_modules on Windows,
// where the bin is a .cmd shim. `--inspector-port` is NOT optional: wrangler
// defaults every Worker to 9229, so the second to start fails to bind and dies.
const child = spawn(
  'wrangler',
  ['dev', '--ip', HOST, '--port', String(port), '--inspector-port', String(inspector)],
  {
    stdio: 'inherit',
    shell: true,
  },
);

child.on('exit', (code) => process.exit(code ?? 0));
