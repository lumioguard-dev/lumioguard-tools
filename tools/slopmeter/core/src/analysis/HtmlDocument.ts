import { parseHTML } from 'linkedom';

/** linkedom's own types: this package compiles without the DOM lib. */
type ParsedDocument = ReturnType<typeof parseHTML>['document'];
type ParsedElement = NonNullable<ReturnType<ParsedDocument['querySelector']>>;

interface AnchorRef {
  readonly href: string;
}

interface ImageRef {
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
  readonly styleAttrs: readonly string[];
  readonly elementCount: number;
  readonly divCount: number;
  readonly semanticCount: number;
  readonly assetRefs: string;
  readonly internalPaths: ReadonlySet<string>;
  /** Every element, walked once, for rules that filter rather than select. */
  readonly elements: readonly ParsedElement[];
  readonly root: ParsedDocument;
}

const SEMANTIC = new Set([
  'HEADER',
  'NAV',
  'MAIN',
  'FOOTER',
  'ARTICLE',
  'SECTION',
  'ASIDE',
  'FIGURE',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'P',
  'UL',
  'OL',
  'LI',
  'TABLE',
]);

const HEADING = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);

/**
 * `<link>` rels that actually fetch something. Counting `rel=canonical` would
 * fingerprint every site as built by whatever its own domain is named after.
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
  /** Kept per attribute so pairing rules can require both utilities on ONE element. */
  public readonly classAttrs: readonly string[];
  public readonly styleAttrs: readonly string[];
  /** Every class attribute joined; use `hasSameClassAttr` for pairing rules. */
  public readonly classText: string;
  /**
   * Every inline `style` attribute joined. A page built by Framer, Webflow or
   * any CSS-in-JS tool carries its layout here rather than in class names, so a
   * rule that reads only `classText` is blind to it.
   */
  public readonly styleText: string;
  public readonly elementCount: number;
  public readonly divCount: number;
  public readonly semanticCount: number;
  /** Resources the page actually LOADS. */
  public readonly assetRefs: string;
  public readonly internalPaths: ReadonlySet<string>;
  public readonly elements: readonly ParsedElement[];
  public readonly root: ParsedDocument;

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
    this.styleAttrs = Object.freeze([...data.styleAttrs]);
    this.classText = data.classAttrs.join(' ');
    this.styleText = data.styleAttrs.join(';');
    this.elementCount = data.elementCount;
    this.divCount = data.divCount;
    this.semanticCount = data.semanticCount;
    this.assetRefs = data.assetRefs;
    this.internalPaths = data.internalPaths;
    this.elements = Object.freeze([...data.elements]);
    this.root = data.root;
    Object.freeze(this);
  }

  /**
   * Parsed with a real HTML parser, never regexes: a regex cannot tell markup
   * from a string inside a `<script>`, and the attribute patterns missed
   * unquoted values, which let a builder's own page read as having no navigation.
   */
  public static from(html: string, pageUrl: URL | null): HtmlDocument {
    const { document } = parseHTML(html);
    const all = [...document.querySelectorAll('*')];
    const text = (el: ParsedElement | null): string =>
      (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

    const meta: Record<string, string> = {};
    const links: ParsedElement[] = [];
    const anchors: AnchorRef[] = [];
    const images: ImageRef[] = [];
    const scriptSources: string[] = [];
    const headings: HeadingRef[] = [];
    const classAttrs: string[] = [];
    const styleAttrs: string[] = [];
    const assets: string[] = [];
    let divCount = 0;
    let semanticCount = 0;

    // One pass. Twelve separate walks of the same tree cost 68ms on a 431KB
    // page where this costs 27ms, and linkedom recompiles every selector.
    for (const el of all) {
      const tag = el.tagName;
      const className = el.getAttribute('class');
      if (className !== null && className !== '') classAttrs.push(className);
      const style = el.getAttribute('style');
      if (style !== null && style !== '') styleAttrs.push(style);
      const src = el.getAttribute('src');
      if (src !== null && src !== '') assets.push(src);
      const srcset = el.getAttribute('srcset');
      if (srcset !== null && srcset !== '') assets.push(srcset);

      if (tag === 'DIV') divCount += 1;
      if (SEMANTIC.has(tag)) semanticCount += 1;

      switch (tag) {
        case 'META': {
          const key = (
            el.getAttribute('name') ??
            el.getAttribute('property') ??
            el.getAttribute('http-equiv') ??
            ''
          ).toLowerCase();
          if (key !== '' && !(key in meta)) meta[key] = el.getAttribute('content') ?? '';
          break;
        }
        case 'LINK':
          links.push(el);
          break;
        case 'A':
          anchors.push({ href: el.getAttribute('href') ?? '' });
          break;
        case 'IMG':
          images.push({ src: src ?? '', alt: el.getAttribute('alt') });
          break;
        case 'SCRIPT':
          if (src !== null && src !== '') scriptSources.push(src);
          break;
        default:
          if (HEADING.has(tag)) headings.push({ level: Number(tag.slice(1)), text: text(el) });
      }
    }

    return new HtmlDocument({
      title: text(document.querySelector('title')),
      lang: document.documentElement?.getAttribute('lang') ?? null,
      meta,
      generator: (meta.generator ?? '').toLowerCase(),
      hasIcon: links.some((el) => /\bicon\b/i.test(el.getAttribute('rel') ?? '')),
      anchors,
      images,
      scriptSources,
      headings,
      classAttrs,
      styleAttrs,
      elementCount: all.length,
      divCount,
      semanticCount,
      assetRefs: [
        ...assets,
        ...links
          .filter((el) => LOADING_RELS.test(el.getAttribute('rel') ?? ''))
          .map((el) => el.getAttribute('href') ?? ''),
      ]
        .join('\n')
        .toLowerCase(),
      internalPaths: HtmlDocument.collectInternalPaths(anchors, pageUrl),
      elements: all,
      root: document,
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

  public get inlineStyleCount(): number {
    return this.styleAttrs.length;
  }

  /** Every pattern on ONE element's inline style. See `hasSameClassAttr`. */
  public hasSameStyleAttr(...patterns: readonly RegExp[]): boolean {
    return this.styleAttrs.some((attr) => patterns.every((pattern) => pattern.test(attr)));
  }

  public countStyleAttr(...patterns: readonly RegExp[]): number {
    return this.styleAttrs.filter((attr) => patterns.every((pattern) => pattern.test(attr))).length;
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
