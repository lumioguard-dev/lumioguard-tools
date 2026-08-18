import { UrlNormalizer } from './UrlNormalizer.js';

const NON_DOCUMENT =
  /\.(?:pdf|zip|png|jpe?g|gif|svg|webp|avif|ico|mp4|webm|mp3|wav|css|js|json|xml|rss|txt|woff2?|ttf|eot|dmg|exe|pkg)$/i;

/** Same-origin, HTML-looking links found in the markup. */
export class LinkExtractor {
  private readonly normalizer: UrlNormalizer;

  public constructor(normalizer: UrlNormalizer = new UrlNormalizer()) {
    this.normalizer = normalizer;
  }

  public extract(html: string, baseUrl: string): string[] {
    let origin: string;
    try {
      origin = new URL(baseUrl).origin;
    } catch {
      return [];
    }

    const found = new Set<string>();
    for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
      const href = (match[2] ?? match[3] ?? '').trim();
      if (href === '' || href.startsWith('#') || /^(?:mailto|tel|javascript|data):/i.test(href)) {
        continue;
      }
      try {
        const absolute = this.normalizer.normalize(new URL(href, baseUrl));
        if (absolute.origin !== origin) continue;
        if (NON_DOCUMENT.test(absolute.pathname)) continue;
        found.add(absolute.toString());
      } catch {
        /* unparseable href */
      }
    }
    return [...found];
  }
}
