import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { type ProxyOptions, type UserConfig, defineConfig } from 'vite';
// @ts-expect-error -- plain .mjs tooling module, no types and none wanted: it is
// read by the Vite config and by scripts/dev-worker.mjs, neither of which is
// part of the typechecked app.
import { HOST, apiPorts, appPort } from '../../scripts/ports.mjs';
import { seo } from './build/seo.js';
import { CATALOGUE } from './src/tools/catalogue.js';

const TOOL_PAGES = CATALOGUE.map((tool) => tool.slug);

const source = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

/**
 * One proxy row per tool, built from `ports.json`. `/<tool>/api/...` is
 * rewritten to `/api/...` on that tool's port, so the Workers keep the routes
 * they already serve and a fourth tool is proxied with no edit here.
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
    // Explicit, not inherited: a source map would publish this app's readable
    // source alongside the bundle. No detector reaches the client, but the
    // client is still the half an attacker can read.
    sourcemap: false,
    // One document per reading, each booting the same bundle. Real files rather
    // than a host rewrite: a rewrite serves one document at three URLs, so all
    // three carry one title and one canonical and none of them can rank.
    rollupOptions: {
      input: {
        index: source('index.html'),
        scan: source('scan.html'),
        ...Object.fromEntries(TOOL_PAGES.map((slug) => [slug, source(`${slug}.html`)])),
      },
    },
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
