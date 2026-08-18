import type { HtmlDocument } from './HtmlDocument.js';
import type { StyleSheets } from './StyleSheets.js';
import type { TextContent } from './TextContent.js';

/** Everything a rule may read. Rules receive this, never the raw snapshot. */
export interface PageContext {
  readonly url: URL | null;
  readonly host: string;
  readonly html: string;
  readonly rawByteLength: number;
  readonly wasTruncated: boolean;
  readonly headers: Readonly<Record<string, string>>;
  readonly document: HtmlDocument;
  readonly styles: StyleSheets;
  readonly content: TextContent;

  /** Occurrence threshold scaled by how much CSS the site ships. */
  atLeast(count: number, base: number): boolean;

  /**
   * Evidence that the page was BUILT with `needle`, read only from resources
   * it loads and from the generator tag.
   */
  builtWith(needle: string): string | null;

  /**
   * Is the class actually applied in the markup? A framework bundle ships every
   * utility whether the page uses it or not, so style rules ask this rather
   * than searching the stylesheet.
   */
  usesClass(pattern: RegExp): boolean;
}

export class PageContextImpl implements PageContext {
  public readonly url: URL | null;
  public readonly host: string;
  public readonly html: string;
  public readonly rawByteLength: number;
  public readonly wasTruncated: boolean;
  public readonly headers: Readonly<Record<string, string>>;
  public readonly document: HtmlDocument;
  public readonly styles: StyleSheets;
  public readonly content: TextContent;

  public constructor(init: {
    url: URL | null;
    host: string;
    html: string;
    rawByteLength: number;
    wasTruncated: boolean;
    headers: Readonly<Record<string, string>>;
    document: HtmlDocument;
    styles: StyleSheets;
    content: TextContent;
  }) {
    this.url = init.url;
    this.host = init.host;
    this.html = init.html;
    this.rawByteLength = init.rawByteLength;
    this.wasTruncated = init.wasTruncated;
    this.headers = init.headers;
    this.document = init.document;
    this.styles = init.styles;
    this.content = init.content;
    Object.freeze(this);
  }

  public atLeast(count: number, base: number): boolean {
    return count >= Math.ceil(base * this.styles.scale);
  }

  public builtWith(needle: string): string | null {
    const term = needle.toLowerCase();
    if (this.document.generator.includes(term)) return 'generator tag';
    if (this.document.assetRefs.includes(term)) return 'asset reference';
    return null;
  }

  public usesClass(pattern: RegExp): boolean {
    return pattern.test(this.document.classText);
  }
}
