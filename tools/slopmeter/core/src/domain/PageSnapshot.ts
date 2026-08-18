/** The analyzer never performs I/O; it is handed one of these, so scans stay reproducible. */
export class PageSnapshot {
  public readonly url: string | null;
  public readonly html: string;
  public readonly stylesheets: readonly string[];
  public readonly headers: Readonly<Record<string, string>>;

  private constructor(init: {
    url: string | null;
    html: string;
    stylesheets: readonly string[];
    headers: Readonly<Record<string, string>>;
  }) {
    this.url = init.url;
    this.html = init.html;
    this.stylesheets = Object.freeze([...init.stylesheets]);
    this.headers = Object.freeze({ ...init.headers });
    Object.freeze(this);
  }

  public static create(init: {
    url?: string | null;
    html: string;
    stylesheets?: readonly string[];
    headers?: Record<string, string>;
  }): PageSnapshot {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(init.headers ?? {})) {
      headers[key.toLowerCase()] = value;
    }
    return new PageSnapshot({
      url: init.url ?? null,
      html: init.html ?? '',
      stylesheets: init.stylesheets ?? [],
      headers,
    });
  }

  public get host(): string | null {
    if (this.url === null) return null;
    try {
      return new URL(this.url).hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  }
}
