// Start a tool's Worker on its allocated port.
//
//   node ../../scripts/dev-worker.mjs slopmeter
//
// Exists so the Worker's port and the web app's proxy target come from one row
// in ports.json rather than from two literals in two files. `--port` used to be
// written into each api package.json, where it silently disagreed with the
// proxy the day either moved.
//
// Binds the same loopback address the web servers do. wrangler defaults to
// 127.0.0.1 and Vite defaults to ::1, so the two halves of one tool listened on
// different IP stacks: `127.0.0.1:<web>` refused connections while
// `localhost:<web>` worked, and anything resolving localhost the other way lost
// the API instead. Same host for both, stated once, in ports.json.

import { spawn } from 'node:child_process';
import { HOST, portsFor } from './ports.mjs';

const tool = process.argv[2];
if (!tool) {
  console.error('usage: dev-worker.mjs <tool>');
  process.exit(1);
}

let port;
try {
  port = portsFor(tool).api;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

console.log(`[ports] ${tool} api → http://${HOST}:${port}`);

// `shell: true` so this resolves wrangler from the package's own node_modules
// bin on Windows, where the bin is a .cmd shim rather than an executable.
const child = spawn('wrangler', ['dev', '--ip', HOST, '--port', String(port)], {
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => process.exit(code ?? 0));
