import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { type ProxyOptions, type UserConfig, defineConfig } from 'vite';
// @ts-expect-error -- plain .mjs tooling module, no types and none wanted: it is
// read by the Vite config and by scripts/dev-worker.mjs, neither of which is
// part of the typechecked app.
import { HOST, apiPorts, appPort } from '../../scripts/ports.mjs';
import { seo } from './build/seo.js';

const source = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

/**
 * `/<tool>/api/...` is rewritten to `/api/...` on that tool's port, so the Workers
 * keep the routes they already serve and a fourth tool needs no edit here.
 */
function toolProxies(): NonNullable<UserConfig['server']>['proxy'] {
  const rows: Record<string, ProxyOptions> = {};
  for (const [tool, port] of Object.entries(apiPorts() as Record<string, number>)) {
    rows[`/${tool}/api`] = {
      target: `http://${HOST}:${port}`,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(`/${tool}`, ''),
    };
  }
  return rows;
}

export default defineConfig({
  plugins: [react(), seo()],
  build: {
    // Explicit, not inherited: a source map would publish this app's readable source
    // alongside the bundle.
    sourcemap: false,
    // ONE entry. Every reading's document is written from it in `build/seo.ts`,
    // so the set follows the catalogue and no page can drift from the others.
  },
  resolve: {
    alias: {
      '@lumioguard/shared': source('../../packages/shared/src/index.ts'),
      '@lumioguard/ui/styles.css': source('../../packages/ui/src/styles.css'),
      '@lumioguard/ui': source('../../packages/ui/src/index.ts'),
      '@lumioguard/web-core': source('../../packages/web-core/src/index.ts'),
      '@lumioguard/design-tokens': source('../../packages/design-tokens/src/index.ts'),
    },
  },
  server: {
    port: appPort('console'),
    // The SAME loopback address the Workers use. Vite defaults to ::1 and
    // wrangler to 127.0.0.1, so the two halves listened on different IP stacks:
    // `127.0.0.1:5200` refused connections while `localhost:5200` worked.
    host: HOST,
    // Fail rather than creep onto the next free port: a silent +1 is how an app
    // ends up answering on a port something else's proxy is pointed at.
    strictPort: true,
    proxy: toolProxies(),
  },
});
