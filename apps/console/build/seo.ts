import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { type Plugin, type ResolvedConfig, type UserConfig, loadEnv } from 'vite';
import { pageForPath } from '../src/tools/catalogue.js';
import { DOCUMENTS, documentFor } from './documents.js';
import { HOME, LEADERBOARD_PAGE, OG_IMAGE, SCAN_PAGE, headTags, toolPage } from './head.js';
import { CONTENT_PAGES } from './pages/content.js';
import { renderPage } from './pages/render.js';
import { staticShell } from './shell.js';
import { SITE_URL_VAR, type Site, assetBase, site } from './site.js';
import { llmsTxt, robotsTxt, sitemapXml } from './wellKnown.js';

/** The README's own screenshot: two pictures of one screen can disagree. */
const CARD_SOURCE = new URL('../../../assets/readout-home.jpg', import.meta.url);

/**
 * A missing anchor THROWS: `replace` with no match returns the string unchanged,
 * so a deleted one would ship the empty `#root` that `access.shell` calls a
 * blocker, and the build would pass.
 */
const HEAD_ANCHOR = '<!--seo:head-->';
const CHROME_ANCHOR = '<!--seo:chrome-->';
const MOUNT_ANCHOR = '<div id="root"></div>';

/** The icon carries the mount, or a mounted app asks the HOST for its favicon. */
function chrome(mount: string): string {
  return `<link rel="icon" href="${mount}/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <meta name="color-scheme" content="light dark" />
    <script>
      (function () {
        try {
          // Must match THEME_STORAGE_KEY in @lumioguard/design-tokens, which
          // useTheme reads, or a saved dark choice flashes light for one frame.
          var stored = localStorage.getItem("slopmeter-theme");
          document.documentElement.setAttribute(
            "data-theme",
            stored === "dark" || stored === "light" ? stored : "light"
          );
        } catch (e) {
          document.documentElement.setAttribute("data-theme", "light");
        }
      })();
    </script>
    <link
      href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Architects+Daughter&display=swap"
      rel="stylesheet"
    />`;
}

interface WellKnownFile {
  readonly name: string;
  readonly type: string;
  readonly body: string;
}

function wellKnown(where: Site | null): readonly WellKnownFile[] {
  const text = 'text/plain; charset=utf-8';
  const mounted = where !== null && where.path !== '';

  return [
    // robots.txt is only read at the root of a host. Shipped under a mount it would
    // claim this app directs crawlers when the host's own robots.txt governs.
    ...(mounted ? [] : [{ name: 'robots.txt', type: text, body: robotsTxt(where) }]),
    { name: 'llms.txt', type: text, body: llmsTxt(where) },
    // A sitemap is absolute URLs or it is nothing: `<loc>` has no relative
    // form, so with no site configured there is no honest file to write.
    ...(where === null
      ? []
      : [{ name: 'sitemap.xml', type: 'application/xml; charset=utf-8', body: sitemapXml(where) }]),
  ];
}

function replaceOnce(html: string, anchor: string, into: string): string {
  if (!html.includes(anchor)) {
    throw new Error(`[seo] index.html no longer contains ${anchor}; nothing would be injected.`);
  }
  return html.replace(anchor, into);
}

/** The same `index.html` for ONE page: the path decides what fills the anchors. */
function documentAt(html: string, pathname: string, where: Site | null, hasCard: boolean): string {
  const page = pageForPath(pathname);
  const meta =
    page.kind === 'tool'
      ? toolPage(page.tool)
      : page.kind === 'scan'
        ? SCAN_PAGE
        : page.kind === 'leaderboard'
          ? LEADERBOARD_PAGE
          : HOME;

  const withHead = replaceOnce(html, HEAD_ANCHOR, headTags(meta, where, hasCard));
  const withChrome = replaceOnce(withHead, CHROME_ANCHOR, chrome(where?.path ?? ''));
  return replaceOnce(
    withChrome,
    MOUNT_ANCHOR,
    `<div id="root">${staticShell(where?.path ?? '', page)}
    </div>`,
  );
}

/**
 * One plugin, not three, because the parts must agree: the canonical, the sitemap
 * entry and robots.txt's `Sitemap:` line are one origin written thrice.
 */
export function seo(): Plugin {
  let where: Site | null = null;
  let card: Uint8Array | null = null;
  let files: readonly WellKnownFile[] = [];

  return {
    name: 'lumioguard:seo',
    enforce: 'post',

    /**
     * The asset base comes from the SAME variable as the canonical. Written twice,
     * a page would link somewhere its own canonical denies.
     */
    config(userConfig: UserConfig, { mode }): UserConfig {
      const base = assetBase(loadEnv(mode, userConfig.root ?? '.', 'VITE_'));
      // A disagreeing `--base` is REFUSED, not overruled: Vite takes this hook's
      // value, so assets would ship under one path while the canonical claims another.
      if (userConfig.base !== undefined && userConfig.base !== base) {
        throw new Error(
          `[seo] --base=${userConfig.base} disagrees with ${SITE_URL_VAR} (${base}). The mount point is written once, in the URL; drop the flag.`,
        );
      }
      return { base };
    },

    async configResolved(config: ResolvedConfig) {
      // `config.env` is what Vite already loaded, so this reads the value the app would.
      where = site(config.env);
      files = wellKnown(where);
      if (where === null) {
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
      handler(html: string, ctx): string {
        // DEV ONLY. The build writes every document in `generateBundle`, from
        // this one file, so the anchors have to survive to there.
        return ctx.server === undefined ? html : documentAt(html, ctx.path, where, card !== null);
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

      // One entry file, so a reading's URL has nothing on disk. Served from it and
      // transformed for THIS path, or dev shows the home page's title everywhere.
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '/').split('?')[0] ?? '/';
        if (documentFor(path) === undefined) return next();

        readFile(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8')
          .then((html) => server.transformIndexHtml(path, html, req.originalUrl))
          .then((out) => {
            res.setHeader('content-type', 'text/html; charset=utf-8');
            res.end(out);
          })
          .catch(next);
      });
    },

    generateBundle(_options, bundle) {
      // The ONE entry Rollup built carries the hashed asset tags with the anchors
      // still unfilled, so every document is that file with its own head put in.
      const entry = bundle['index.html'];
      if (entry === undefined || entry.type !== 'asset') {
        throw new Error('[seo] index.html is not in the bundle; no document could be written.');
      }
      const shell = typeof entry.source === 'string' ? entry.source : entry.source.toString();
      for (const document of DOCUMENTS) {
        const html = documentAt(shell, document.url, where, card !== null);
        if (document.file === 'index.html') {
          entry.source = html;
          continue;
        }
        this.emitFile({ type: 'asset', fileName: document.file, source: html });
      }

      for (const file of files) {
        this.emitFile({ type: 'asset', fileName: file.name, source: file.body });
      }
      // `<slug>.html`, NOT `<slug>/index.html`: Cloudflare Pages answers the second
      // with a 308 to `/slug/`, pointing every canonical at a URL that moves.
      for (const page of CONTENT_PAGES) {
        this.emitFile({
          type: 'asset',
          fileName: `${page.meta.path.replace(/^\//, '')}.html`,
          source: renderPage(page, where, card !== null),
        });
      }
      if (card !== null) {
        this.emitFile({ type: 'asset', fileName: OG_IMAGE.file, source: card });
      }
    },
  };
}
