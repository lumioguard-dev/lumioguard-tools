import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
// @ts-expect-error -- plain .mjs tooling module, no types and none wanted: it is
// read by the Vite config and by scripts/dev-worker.mjs, neither of which is
// part of the typechecked app.
import { HOST, portsFor } from '../../../scripts/ports.mjs';

// One row, two consumers: this app's port and the Worker it proxies to. They
// were separate literals here and in api/package.json: a pair that must agree
// and cannot fail together. Reading throws on a collision, so a clash surfaces
// when a server starts rather than as a proxy quietly answering from the wrong
// tool. See CONTRIBUTING.md.
const ports = portsFor('leakpeek');

export default defineConfig({
  plugins: [react()],
  // Explicit, not inherited: a source map would publish this app's readable
  // source alongside the bundle. The detector itself never reaches the client,
  // but the client is still the half an attacker can read.
  build: { sourcemap: false },
  resolve: {
    alias: {
      '@lumioguard/shared': fileURLToPath(
        new URL('../../../packages/shared/src/index.ts', import.meta.url),
      ),
      '@lumioguard/ui/styles.css': fileURLToPath(
        new URL('../../../packages/ui/src/styles.css', import.meta.url),
      ),
      '@lumioguard/ui': fileURLToPath(
        new URL('../../../packages/ui/src/index.ts', import.meta.url),
      ),
      '@lumioguard/web-core': fileURLToPath(
        new URL('../../../packages/web-core/src/index.ts', import.meta.url),
      ),
      '@lumioguard/design-tokens': fileURLToPath(
        new URL('../../../packages/design-tokens/src/index.ts', import.meta.url),
      ),
    },
  },
  server: {
    port: ports.web,
    // Bound explicitly to the SAME loopback address the Worker uses. Vite
    // defaults to ::1 and wrangler to 127.0.0.1, so the two halves of this tool
    // listened on different IP stacks: `127.0.0.1:5210` refused connections
    // while `localhost:5210` worked, and a client resolving localhost the other
    // way would have lost the API instead. That asymmetry reads as "the backend
    // is down" and is invisible in either server's log.
    host: HOST,
    // Fail rather than creep onto the next free port: a silent +1 is how a tool
    // ends up answering on a port another tool's proxy is pointed at.
    strictPort: true,
    proxy: {
      '/api': { target: `http://${HOST}:${ports.api}`, changeOrigin: true },
    },
  },
});
