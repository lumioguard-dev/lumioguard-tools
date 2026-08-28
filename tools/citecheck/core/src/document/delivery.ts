import { type CiteFinding, finding, quote, when } from '../domain/CiteFinding.js';
import type { PageDocument } from '../read/PageDocument.js';

/**
 * The classic technical-SEO defects a citation audit does not think about. They
 * cost ranking rather than readability, so most weigh on the search axis only.
 */

/** What the api observed getting to the page. */
export interface Delivery {
  /** Final status after redirects. */
  readonly status: number;
  /** How many hops it took. Zero when the first request answered. */
  readonly redirects: number;
  /** The address originally asked for, when it differs from the final one. */
  readonly requestedUrl: string | null;
  /** True when any hop was a temporary redirect. */
  readonly temporary: boolean;
}

/** More than one hop means signals pass through a URL nobody meant to publish. */
const CHAIN_LIMIT = 1;

export function checkDelivery(page: PageDocument, delivery: Delivery | null): CiteFinding[] {
  if (delivery === null) return [];

  return [
    ...when(delivery.redirects > CHAIN_LIMIT, () =>
      finding({
        code: 'document.redirect-chain',
        impact: 'major',
        area: 'document',
        title: `It took ${delivery.redirects} redirects to reach this page`,
        detail:
          'Every hop is a URL that has to be crawled before the real one is, and consolidation weakens along the way. A crawler that gives up partway indexes the redirect rather than the page.',
        evidence: quote(`${delivery.requestedUrl ?? ''} → ${page.url}`),
        fix: 'Point the first URL straight at the final one, in a single 301.',
      }),
    ),
  ];
}
/**
 * No `script` here: `markup` has had every `<script>` element cut out of it, so
 * this pattern could never match one. Insecure scripts are read off
 * `scriptSources`, which is taken from the raw HTML.
 */
const INSECURE_ASSET =
  /<(?:img|iframe|source|video|audio)\b[^>]*\bsrc\s*=\s*["']?(http:\/\/[^"'\s>]+)/gi;

/**
 * A `<link>` counts only when its `rel` actually FETCHES something.
 * `<link rel="profile" href="http://gmpg.org/xfn/11">` is WordPress boilerplate
 * no browser requests, and it reported mixed content on bbcgoodfood.com.
 */
const INSECURE_LINK =
  /<link\b[^>]*\brel\s*=\s*["']?(?:stylesheet|preload|modulepreload|prefetch|icon|apple-touch-icon|manifest|mask-icon)["']?[^>]*\bhref\s*=\s*["']?(http:\/\/[^"'\s>]+)/gi;

/** A stylesheet is the one `rel` a browser refuses outright rather than downgrades. */
const INSECURE_STYLESHEET =
  /<link\b[^>]*\brel\s*=\s*["']?stylesheet["']?[^>]*\bhref\s*=\s*["']?http:\/\//i;

/** Anchors are excluded: linking to an http page is not mixed content. */
export function checkTransport(page: PageDocument): CiteFinding[] {
  if (!page.url.startsWith('https://')) {
    return [
      finding({
        code: 'document.no-https',
        impact: 'major',
        area: 'document',
        title: 'The page is served over http',
        detail:
          'Search engines have preferred https for a decade and browsers mark http pages as not secure. The http and https versions also compete with each other unless one redirects to the other.',
        evidence: quote(page.url),
        fix: 'Serve the site over https and redirect http to it permanently.',
      }),
    ];
  }

  const insecureScripts = page.scriptSources.filter((src) => src.trim().startsWith('http://'));
  const insecure = [
    ...insecureScripts,
    ...[...page.markup.matchAll(INSECURE_ASSET), ...page.markup.matchAll(INSECURE_LINK)]
      .map((match) => match[1])
      .filter((src): src is string => src !== undefined),
  ];

  /**
   * Graded by WHAT is blocked: a browser refuses an insecure script or
   * stylesheet outright, and only declines to paint an insecure image.
   * healthline.com's is a comScore pixel, which costs the page nothing.
   */
  const breaksThePage = insecureScripts.length > 0 || INSECURE_STYLESHEET.test(page.markup);

  return when(insecure.length > 0, () =>
    finding({
      code: 'document.mixed-content',
      impact: breaksThePage ? 'major' : 'minor',
      area: 'document',
      title: `${insecure.length} ${insecure.length === 1 ? 'asset loads' : 'assets load'} over http on an https page`,
      detail:
        'Browsers block or downgrade insecure assets on a secure page, so what loads for a visitor is not what the page asked for.',
      evidence: quote(insecure.slice(0, 2).join(' · ')),
      fix: 'Load every asset over https.',
    }),
  );
}

const VIEWPORT = 'viewport';

/**
 * Mobile-first indexing means the mobile rendering is the one indexed, and a
 * page with no viewport is rendered at desktop width and scaled down.
 */
export function checkMobile(page: PageDocument): CiteFinding[] {
  return when(page.meta[VIEWPORT] === undefined, () =>
    finding({
      code: 'document.no-viewport',
      impact: 'major',
      area: 'document',
      title: 'No viewport meta tag',
      detail:
        'Search engines index the mobile rendering of a page. Without a viewport it is laid out at desktop width and scaled down, which is the version that gets judged.',
      evidence: null,
      fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
    }),
  );
}

/** A refresh in markup is a redirect a crawler may not follow or may not credit. */
const META_REFRESH =
  /<meta\b[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*content\s*=\s*["']([^"']*)/i;

export function checkMetaRefresh(page: PageDocument): CiteFinding[] {
  const match = page.markup.match(META_REFRESH);
  const url = match?.[1] ?? '';
  return when(/url\s*=/i.test(url), () =>
    finding({
      code: 'document.meta-refresh',
      impact: 'major',
      area: 'document',
      title: 'The page redirects with a meta refresh',
      detail:
        'A refresh in the markup is a redirect a crawler has to render to notice, and it passes on less than a server redirect does. It is also read by some crawlers as a cloaking attempt.',
      evidence: quote(match?.[0] ?? ''),
      fix: 'Replace it with a 301 from the server.',
    }),
  );
}
