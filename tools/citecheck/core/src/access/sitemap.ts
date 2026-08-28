export interface SitemapRead {
  /** Where it was served from. */
  readonly url: string;
  readonly urlCount: number;
  /** True when the page being read is one of the URLs it lists. */
  readonly listsTarget: boolean;
  /** True when the document is an index pointing at further sitemaps. */
  readonly isIndex: boolean;
}

/**
 * Two URLs are the same entry when only the trailing slash or the scheme
 * differs. Reporting `https://x.com/a/` against a served `https://x.com/a` as a
 * missing entry sends people looking for a bug that is not there.
 */
function sameEntry(a: string, b: string): boolean {
  const key = (value: string): string => {
    try {
      const url = new URL(value);
      const path = url.pathname.replace(/\/+$/, '');
      return `${url.host.toLowerCase().replace(/^www\./, '')}${path}`;
    } catch {
      return value.trim().toLowerCase().replace(/\/+$/, '');
    }
  };
  return key(a) === key(b);
}

/** `<loc>` entries, whether the document is a sitemap or an index of them. */
export function parseSitemap(xml: string, sitemapUrl: string, target: string): SitemapRead {
  const locations = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
    .map((match) => match[1])
    .filter((value): value is string => value !== undefined);

  return {
    url: sitemapUrl,
    urlCount: locations.length,
    listsTarget: locations.some((location) => sameEntry(location, target)),
    isIndex: /<sitemapindex\b/i.test(xml),
  };
}
