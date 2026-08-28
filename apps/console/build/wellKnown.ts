import { DESCRIPTION, EXAMPLES, TITLE } from '../src/copy.js';
import { CATALOGUE, SCAN_SLUG, leaderboardPath } from '../src/tools/catalogue.js';
import { CONTENT_PAGES } from './pages/content.js';
import { type Site, absolute } from './site.js';

/**
 * Generated rather than checked in: two of these carry absolute URLs and the third
 * has to agree, and a robots.txt naming a sitemap on the wrong host reports nothing.
 */

/**
 * `Disallow:` with an empty value is RFC 9309 for "all of it is yours". A site whose
 * subject is machine legibility turning machines away is `access.llms-contradiction`.
 */
export function robotsTxt(where: Site | null): string {
  const lines = [
    `# ${TITLE} Every page here is meant to be found, by people and by agents.`,
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
 * Readings are not listed: they live at `?site=…` and canonicalise back, so each
 * would be one document under another name. No `lastmod`: it could only be the
 * build time, and would change when nothing about the page did.
 */
export function sitemapXml(where: Site): string {
  const paths = [
    '/',
    `/${SCAN_SLUG}`,
    leaderboardPath(),
    ...CATALOGUE.map((tool) => `/${tool.slug}`),
    ...CONTENT_PAGES.map((page) => page.meta.path),
  ];
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
 * Format per llmstxt.org: one H1, a blockquote summary, then sections of links.
 * Readings come from the catalogue, so this cannot describe tools the app lacks.
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
    `# ${TITLE}`,
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
