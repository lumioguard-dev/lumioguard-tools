import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Plugin, ResolvedConfig } from 'vite';
import { HOME, OG_IMAGE, headTags } from './head.js';
import { CONTENT_PAGES } from './pages/content.js';
import { renderPage } from './pages/render.js';
import { staticShell } from './shell.js';
import { SITE_URL_VAR, siteOrigin } from './site.js';
import { llmsTxt, robotsTxt, sitemapXml } from './wellKnown.js';

/**
 * The screenshot the README already uses, rather than a second copy under
 * `public/`: two pictures of one screen can disagree about what the app is.
 */
const CARD_SOURCE = new URL('../../../assets/readout-home.jpg', import.meta.url);

/**
 * Where the generated markup goes. A miss THROWS rather than no-ops:
 * `String.replace` with no match returns the string unchanged, so editing an
 * anchor out of `index.html` would silently ship the empty `#root` that
 * `access.shell` calls a blocker, and the build would look fine.
 */
const HEAD_ANCHOR = '<!--seo:head-->';
const MOUNT_ANCHOR = '<div id="root"></div>';

/** Served in dev and emitted at build, so what you check locally is what ships. */
interface WellKnownFile {
  readonly name: string;
  readonly type: string;
  readonly body: string;
}

function wellKnown(origin: string | null): readonly WellKnownFile[] {
  const text = 'text/plain; charset=utf-8';
  return [
    { name: 'robots.txt', type: text, body: robotsTxt(origin) },
    { name: 'llms.txt', type: text, body: llmsTxt(origin) },
    // A sitemap is absolute URLs or it is nothing: `<loc>` has no relative
    // form, so with no origin there is no honest file to write.
    ...(origin === null
      ? []
      : [
          { name: 'sitemap.xml', type: 'application/xml; charset=utf-8', body: sitemapXml(origin) },
        ]),
  ];
}

function replaceOnce(html: string, anchor: string, into: string): string {
  if (!html.includes(anchor)) {
    throw new Error(`[seo] index.html no longer contains ${anchor}; nothing would be injected.`);
  }
  return html.replace(anchor, into);
}

/**
 * Everything that makes this app legible to something that is not a browser.
 *
 * One plugin rather than three because the parts must agree: the canonical, the
 * sitemap's entry and the robots.txt `Sitemap:` line are one origin written
 * three times, and the shell names the readings the JSON-LD lists.
 */
export function seo(): Plugin {
  let origin: string | null = null;
  let card: Uint8Array | null = null;
  let files: readonly WellKnownFile[] = [];

  return {
    name: 'lumioguard:seo',
    enforce: 'post',

    async configResolved(config: ResolvedConfig) {
      // `config.env` is what Vite already loaded from the .env files, so this
      // reads the same value the app would and needs no access to the process.
      origin = siteOrigin(config.env);
      files = wellKnown(origin);
      if (origin === null) {
        config.logger.warn(
          `[seo] ${SITE_URL_VAR} is not set: no canonical, no OpenGraph URL, no sitemap and no Sitemap: line in robots.txt. Set it to this deployment's origin before publishing.`,
        );
      }

      try {
        card = await readFile(fileURLToPath(CARD_SOURCE));
      } catch {
        // Missing art costs the card, not the build. Half an OpenGraph image
        // is a broken preview, so the tags are omitted with it.
        card = null;
        config.logger.warn('[seo] No card image at assets/readout-home.jpg: og:image omitted.');
      }
    },

    transformIndexHtml: {
      order: 'post',
      handler(html: string) {
        const withHead = replaceOnce(html, HEAD_ANCHOR, headTags(HOME, origin, card !== null));
        return replaceOnce(withHead, MOUNT_ANCHOR, `<div id="root">${staticShell()}\n    </div>`);
      },
    },

    /** Dev serves the same bytes the build emits, so a check locally is a check. */
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0];
        const match = files.find((file) => path === `/${file.name}`);
        if (match === undefined) return next();
        res.setHeader('content-type', match.type);
        res.end(match.body);
      });
    },

    generateBundle() {
      for (const file of files) {
        this.emitFile({ type: 'asset', fileName: file.name, source: file.body });
      }
      // `<slug>.html`, NOT `<slug>/index.html`. Cloudflare Pages answers
      // `/slug` from `/slug.html` with a 200, but answers it from
      // `/slug/index.html` with a 308 to `/slug/`. That redirect would make
      // every canonical, sitemap entry and internal link point at a URL that
      // moves, which is a defect the tool in this repo reports.
      for (const page of CONTENT_PAGES) {
        this.emitFile({
          type: 'asset',
          fileName: `${page.meta.path.replace(/^\//, '')}.html`,
          source: renderPage(page, origin, card !== null),
        });
      }
      if (card !== null) {
        this.emitFile({ type: 'asset', fileName: OG_IMAGE.file, source: card });
      }
    },
  };
}
