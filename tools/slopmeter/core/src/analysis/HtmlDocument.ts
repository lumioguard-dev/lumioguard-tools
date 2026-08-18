import { countTagMatches, decodeEntities, readAttribute, readOpenTags } from './TagReader.js';

interface AnchorRef {
  readonly tag: string;
  readonly href: string;
}

interface ImageRef {
  readonly tag: string;
  readonly src: string;
  readonly alt: string | null;
}

interface HeadingRef {
  readonly level: number;
  readonly text: string;
}

interface HtmlDocumentData {
  readonly title: string;
  readonly lang: string | null;
  readonly meta: Readonly<Record<string, string>>;
  readonly generator: string;
  readonly hasIcon: boolean;
  readonly anchors: readonly AnchorRef[];
  readonly images: readonly ImageRef[];
  readonly scriptSources: readonly string[];
  readonly headings: readonly HeadingRef[];
  readonly classAttrs: readonly string[];
  readonly elementCount: number;
  readonly divCount: number;
  readonly semanticCount: number;
  readonly inlineStyleCount: number;
  readonly assetRefs: string;
  readonly internalPaths: ReadonlySet<string>;
}

/**
 * `<link>` rels that actually fetch something. `rel=canonical` points at the
 * page's own URL, so counting it would fingerprint every site as built by
 * whatever its own domain is named after.
 */
const LOADING_RELS =
  /\b(?:stylesheet|preload|modulepreload|prefetch|preconnect|dns-prefetch|icon|apple-touch-icon|manifest|mask-icon)\b/i;

export class HtmlDocument {
  public readonly title: string;
  public readonly lang: string | null;
  public readonly meta: Readonly<Record<string, string>>;
  public readonly generator: string;
  public readonly hasIcon: boolean;
  public readonly anchors: readonly AnchorRef[];
  public readonly images: readonly ImageRef[];
  public readonly scriptSources: readonly string[];
  public readonly headings: readonly HeadingRef[];
  /** One entry per `class="…"` attribute, kept separate so pairing rules can
   *  require both utilities on ONE element. */
  public readonly classAttrs: readonly string[];
  public readonly elementCount: number;
  public readonly divCount: number;
  public readonly semanticCount: number;
  public readonly inlineStyleCount: number;
  /** Resources the page actually LOADS. */
  public readonly assetRefs: string;
  public readonly internalPaths: ReadonlySet<string>;

  private constructor(data: HtmlDocumentData) {
    this.title = data.title;
    this.lang = data.lang;
    this.meta = Object.freeze({ ...data.meta });
    this.generator = data.generator;
    this.hasIcon = data.hasIcon;
    this.anchors = Object.freeze([...data.anchors]);
    this.images = Object.freeze([...data.images]);
    this.scriptSources = Object.freeze([...data.scriptSources]);
    this.headings = Object.freeze([...data.headings]);
    this.classAttrs = Object.freeze([...data.classAttrs]);
    this.elementCount = data.elementCount;
    this.divCount = data.divCount;
    this.semanticCount = data.semanticCount;
    this.inlineStyleCount = data.inlineStyleCount;
    this.assetRefs = data.assetRefs;
    this.internalPaths = data.internalPaths;
    Object.freeze(this);
  }

  public static from(html: string, pageUrl: URL | null): HtmlDocument {
    const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    const meta: Record<string, string> = {};
    for (const tag of readOpenTags(html, 'meta')) {
      const key = (
        readAttribute(tag, 'name') ??
        readAttribute(tag, 'property') ??
        readAttribute(tag, 'http-equiv') ??
        ''
      ).toLowerCase();
      if (key !== '' && !(key in meta)) meta[key] = readAttribute(tag, 'content') ?? '';
    }

    const htmlTag = (html.match(/<html\b[^>]*>/i) ?? [''])[0] ?? '';
    const linkTags = readOpenTags(html, 'link');
    const anchors: AnchorRef[] = readOpenTags(html, 'a').map((tag) => ({
      tag,
      href: readAttribute(tag, 'href') ?? '',
    }));
    const attrValues = (pattern: RegExp): string[] =>
      [...html.matchAll(pattern)].map((m) => m[2] ?? m[3] ?? '');
    const generatorTag = html.match(/<meta[^>]+name=["']generator["'][^>]*>/i);

    return new HtmlDocument({
      title:
        titleMatch === null
          ? ''
          : decodeEntities(titleMatch[1] ?? '')
              .replace(/\s+/g, ' ')
              .trim(),
      lang: readAttribute(htmlTag, 'lang'),
      meta,
      generator:
        generatorTag === null
          ? ''
          : (readAttribute(generatorTag[0], 'content') ?? '').toLowerCase(),
      hasIcon: linkTags.some((tag) => /\brel\s*=\s*["']?[^"'>]*\bicon\b/i.test(tag)),
      anchors,
      images: readOpenTags(html, 'img').map((tag) => ({
        tag,
        src: readAttribute(tag, 'src') ?? '',
        alt: readAttribute(tag, 'alt'),
      })),
      scriptSources: readOpenTags(html, 'script')
        .map((tag) => readAttribute(tag, 'src') ?? '')
        .filter((src) => src !== ''),
      headings: [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({
        level: Number(m[1]),
        text: decodeEntities((m[2] ?? '').replace(/<[^>]+>/g, ' '))
          .replace(/\s+/g, ' ')
          .trim(),
      })),
      classAttrs: attrValues(/\bclass\s*=\s*("([^"]*)"|'([^']*)')/gi),
      elementCount: countTagMatches(html, /<[a-z][a-z0-9-]*[\s>]/gi),
      divCount: countTagMatches(html, /<div[\s>]/gi),
      semanticCount: countTagMatches(
        html,
        /<(?:header|nav|main|footer|article|section|aside|figure|h[1-6]|p|ul|ol|li|table)[\s>]/gi,
      ),
      inlineStyleCount: countTagMatches(html, /\bstyle\s*=\s*["']/gi),
      assetRefs: [
        ...attrValues(/\bsrc\s*=\s*("([^"]*)"|'([^']*)')/gi),
        ...linkTags
          .filter((tag) => LOADING_RELS.test(readAttribute(tag, 'rel') ?? ''))
          .map((tag) => readAttribute(tag, 'href') ?? ''),
        ...attrValues(/\bsrcset\s*=\s*("([^"]*)"|'([^']*)')/gi),
      ]
        .join('\n')
        .toLowerCase(),
      internalPaths: HtmlDocument.collectInternalPaths(anchors, pageUrl),
    });
  }

  private static collectInternalPaths(
    anchors: readonly AnchorRef[],
    pageUrl: URL | null,
  ): ReadonlySet<string> {
    const paths = new Set<string>();
    const base = pageUrl ?? new URL('https://example.invalid/');
    for (const anchor of anchors) {
      const href = anchor.href.trim();
      if (href === '' || href.startsWith('#') || /^(mailto|tel|javascript):/i.test(href)) continue;
      try {
        const absolute = new URL(href, base);
        if (pageUrl !== null && absolute.hostname !== pageUrl.hostname) continue;
        const path = absolute.pathname.replace(/\/+$/, '');
        if (path !== '') paths.add(path);
      } catch {
        /* unparseable href */
      }
    }
    return paths;
  }

  /** Every class attribute joined; use `hasSameClassAttr` for pairing rules. */
  public get classText(): string {
    return this.classAttrs.join(' ');
  }

  /**
   * Every pattern on ONE element, not merely all present somewhere on the page.
   * Checked separately, any page with a rounded avatar, small text somewhere and
   * a border anywhere qualified as a hero pill chip.
   */
  public hasSameClassAttr(...patterns: readonly RegExp[]): boolean {
    return this.classAttrs.some((attr) => patterns.every((pattern) => pattern.test(attr)));
  }
}
