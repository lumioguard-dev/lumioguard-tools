import { DESCRIPTION, EXAMPLES, NAME } from '../src/copy.js';
import { CATALOGUE } from '../src/tools/catalogue.js';
import { CONTENT_PAGES } from './pages/content.js';
import { type Site, absolute } from './site.js';

/**
 * The files a crawler looks for before it looks at a page. Generated rather
 * than checked in: two carry absolute URLs and the third has to agree with
 * them, and a robots.txt naming a sitemap on the wrong host reports nothing.
 */

/**
 * `Disallow:` with an empty value is RFC 9309 for "all of it is yours", and no
 * agent is blocked: a site whose subject is machine legibility turning machines
 * away is the `access.llms-contradiction` pair with llms.txt below.
 */
export function robotsTxt(where: Site | null): string {
  const lines = [
    `# ${NAME}. Every page here is meant to be found, by people and by agents.`,
    '',
    'User-agent: *',
    'Disallow:',
    '',
  ];
  // A sitemap line needs an absolute URL; there is no relative form of it.
  if (where !== null) lines.push(`Sitemap: ${absolute(where.base, '/sitemap.xml')}`, '');
  return lines.join('\n');
}

/**
 * The app, then every explainer. Readings are not listed: they live at
 * `?site=…` on the app and canonicalise back to it, so each would be the same
 * document under another name.
 *
 * No `lastmod`, which would have to be the build time and so would change when
 * nothing about the page did. No `changefreq` or `priority`; nothing reads them.
 */
export function sitemapXml(where: Site): string {
  const paths = ['/', ...CONTENT_PAGES.map((page) => page.meta.path)];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.flatMap((path) => [
      '  <url>',
      `    <loc>${absolute(where.base, path)}</loc>`,
      '  </url>',
    ]),
    '</urlset>',
    '',
  ].join('\n');
}

/**
 * The same page, written for something that is going to read it rather than
 * render it. Format per llmstxt.org: one H1, a blockquote summary, then
 * sections of links.
 *
 * The readings are listed from the catalogue, so this file cannot describe a
 * set of tools the app does not offer.
 */
export function llmsTxt(where: Site | null): string {
  const link = (path: string): string => (where === null ? path : absolute(where.base, path));

  const readings = CATALOGUE.map(
    (tool) => `- [${tool.label}](${link(`/?tools=${tool.id}`)}): ${tool.summary}`,
  );

  const examples = EXAMPLES.map(
    (site) => `- [${site}](${link(`/?site=${encodeURIComponent(site)}`)}): a reading of ${site}`,
  );

  return [
    `# ${NAME}`,
    '',
    `> ${DESCRIPTION}`,
    '',
    'Paste any public URL. Every reading you pick runs at once against its own',
    'engine, and they land on a single verdict: the worst of them, with each',
    'reading underneath it. Every reading is a read: no tool here writes to the',
    'site it is reading.',
    '',
    '## Readings',
    '',
    ...readings,
    '',
    '## Examples',
    '',
    ...examples,
    '',
    '## Reference',
    '',
    ...CONTENT_PAGES.map(
      (page) => `- [${page.meta.title}](${link(page.meta.path)}): ${page.meta.description}`,
    ),
    '',
  ].join('\n');
}
