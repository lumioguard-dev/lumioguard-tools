import { DESCRIPTION, LEADERBOARD, PUBLISHER, SCAN, TITLE } from '../src/copy.js';
import type { PageLink } from '../src/pages.js';
import { CATALOGUE, SCAN_SLUG, type ToolCopy, leaderboardPath } from '../src/tools/catalogue.js';
import { escapeHtml } from './html.js';
import { type Site, absolute } from './site.js';

/** The path is derived from the file name, so tag and emitted asset cannot differ. */
const CARD_FILE = 'og.jpg';
export const OG_IMAGE = {
  file: CARD_FILE,
  path: `/${CARD_FILE}`,
  width: 1568,
  height: 773,
  alt: 'A site read: one verdict, with each reading underneath it',
} as const;

export const HOME: PageLink = { path: '/', title: TITLE, description: DESCRIPTION };

export const SCAN_PAGE: PageLink = {
  path: `/${SCAN_SLUG}`,
  title: SCAN.headline,
  description: SCAN.description,
};

export const LEADERBOARD_PAGE: PageLink = {
  path: leaderboardPath(),
  title: LEADERBOARD.headline,
  description: LEADERBOARD.description,
};

export function toolPage(tool: ToolCopy): PageLink {
  return {
    path: `/${tool.slug}`,
    title: tool.headline,
    description: tool.description,
  };
}

/** Split by whether it needs the origin. `site.ts` says why the absent case writes none. */
export function headTags(page: PageLink, where: Site | null, hasImage: boolean): string {
  const originless: string[] = [
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="${escapeHtml(PUBLISHER)}" />`,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    '<meta property="og:locale" content="en" />',
    `<meta name="twitter:card" content="${hasImage ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
  ];

  if (where === null) return originless.join('\n    ');

  const self = absolute(where.base, page.path);
  return [
    ...originless,
    // Every reading lives at `?site=…` on this one document, so the canonical stops
    // a crawler indexing a thin JavaScript-only variant per site ever read.
    `<link rel="canonical" href="${escapeHtml(self)}" />`,
    `<meta property="og:url" content="${escapeHtml(self)}" />`,
    ...(hasImage ? imageTags(absolute(where.base, OG_IMAGE.path)) : []),
    `<script type="application/ld+json">${jsonLd(page, where, hasImage)}</script>`,
  ].join('\n    ');
}

/** All of them or none: a card with a broken picture is worse than a plain one. */
function imageTags(card: string): string[] {
  return [
    `<meta property="og:image" content="${escapeHtml(card)}" />`,
    `<meta property="og:image:width" content="${OG_IMAGE.width}" />`,
    `<meta property="og:image:height" content="${OG_IMAGE.height}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(OG_IMAGE.alt)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(card)}" />`,
    `<meta name="twitter:image:alt" content="${escapeHtml(OG_IMAGE.alt)}" />`,
  ];
}

/**
 * The Organization node answers `structured.no-entity`. Explainers are `WebPage`
 * and not `Article`: an Article carries a date, and an evergreen page has none.
 */
function jsonLd(page: PageLink, where: Site, hasImage: boolean): string {
  const home = absolute(where.base, '/');
  const self = absolute(where.base, page.path);

  const nodes = [
    { '@type': 'Organization', '@id': `${home}#publisher`, name: PUBLISHER },
    {
      '@type': 'WebSite',
      '@id': `${home}#website`,
      url: home,
      name: PUBLISHER,
      description: DESCRIPTION,
      inLanguage: 'en',
      publisher: { '@id': `${home}#publisher` },
    },
  ];

  const graph =
    page.path === HOME.path
      ? [...nodes, application(home, hasImage ? absolute(where.base, OG_IMAGE.path) : null)]
      : [...nodes, explainer(page, self, home), breadcrumb(page, self, home)];

  // A raw `<` cannot appear inside a script element, whatever it is a script of.
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(
    /</g,
    '\\u003c',
  );
}

function application(home: string, image: string | null): Record<string, unknown> {
  return {
    '@type': 'WebApplication',
    '@id': `${home}#app`,
    url: home,
    name: PUBLISHER,
    description: DESCRIPTION,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    // The one commercial claim this repo can stand behind: there is no
    // payment path in it. An `offers` node would assert terms nothing defines.
    isAccessibleForFree: true,
    inLanguage: 'en',
    isPartOf: { '@id': `${home}#website` },
    publisher: { '@id': `${home}#publisher` },
    featureList: CATALOGUE.map((tool) => `${tool.label}: ${tool.summary}`),
    ...(image === null ? {} : { image }),
  };
}

function explainer(page: PageLink, self: string, home: string): Record<string, unknown> {
  return {
    '@type': 'WebPage',
    '@id': `${self}#page`,
    url: self,
    name: page.title,
    description: page.description,
    inLanguage: 'en',
    isPartOf: { '@id': `${home}#website` },
    publisher: { '@id': `${home}#publisher` },
  };
}

function breadcrumb(page: PageLink, self: string, home: string): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${self}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: PUBLISHER, item: home },
      { '@type': 'ListItem', position: 2, name: page.title, item: self },
    ],
  };
}
