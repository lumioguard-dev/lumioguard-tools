const TRACKING_PARAM = /^(?:utm_|fbclid|gclid|ref|mc_)/i;

/** Collapses the URLs that mean the same page, so each is scanned once. */
export class UrlNormalizer {
  public normalize(input: string | URL): URL {
    const url = new URL(String(input));
    url.hash = '';

    const params = url.searchParams;
    for (const key of [...params.keys()]) {
      // Tracking parameters never change the document.
      if (TRACKING_PARAM.test(key)) params.delete(key);
    }

    if (url.pathname !== '/' && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.replace(/\/+$/, '');
    }
    return url;
  }

  public normalizeToString(input: string | URL): string {
    return this.normalize(input).toString();
  }
}
