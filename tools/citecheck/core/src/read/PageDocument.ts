import {
  contentRegion,
  readAttribute,
  readElements,
  readOpenTags,
  textOf,
  withoutCode,
  wordCount,
} from './TagReader.js';

export interface HeadingRef {
  readonly level: number;
  readonly text: string;
  /**
   * False for a heading inside a `<footer>` or a `<nav>`.
   *
   * Those are navigation furniture, and their levels are a styling choice
   * rather than the document's outline: counting them reported supabase.com as
   * skipping a level because a screen reader's `<h2>Footer</h2>` sits above six
   * `<h6>` column labels. Nothing else is excluded, because a hero `<h1>` turns
   * up outside `<main>` often enough that a wider rule loses real ones.
   */
  readonly inContent: boolean;
  /** `aria-hidden` marks a copy that exists to be seen and not read. */
  readonly hidden: boolean;
}

export interface AnchorRef {
  /** Null when the element carries no `href` at all, which is its own defect. */
  readonly href: string | null;
  readonly text: string;
  /** The opening tag's attributes, for the checks that ask how it was written. */
  readonly attrs: string;
}

export interface ImageRef {
  readonly src: string;
  /** Null means the attribute is ABSENT. `alt=""` is a decorative image and
   *  arrives here as an empty string, which is a deliberate answer, not a gap. */
  readonly alt: string | null;
}

export interface LinkRef {
  readonly rel: string;
  readonly href: string;
  readonly hreflang: string | null;
}

/**
 * The served page, read once.
 *
 * Every check draws from this rather than re-scanning the HTML, so a page is
 * parsed once per reading however many rules look at it. Built by a static
 * factory rather than a constructor doing the work, so the parse is one
 * traceable step and the fields are all readonly after it.
 */
export class PageDocument {
  public readonly url: string;
  public readonly host: string;
  public readonly html: string;
  /**
   * The document with `<script>`, `<style>` and comments removed.
   *
   * What every check that reads ELEMENTS must use. The raw HTML is kept beside
   * it for the few that genuinely want the code, and mixing them up read
   * cnn.com's Handlebars template as the page's only heading.
   */
  public readonly markup: string;
  /** Lower-cased response header names, as a fetch delivers them. */
  public readonly headers: Readonly<Record<string, string>>;
  public readonly title: string | null;
  public readonly lang: string | null;
  /** `<meta name>` and `http-equiv`, lower-cased, to their content. */
  public readonly meta: Readonly<Record<string, string>>;
  /** `<meta property>`, kept apart: OpenGraph lives here, not in `meta`. */
  public readonly property: Readonly<Record<string, string>>;
  public readonly links: readonly LinkRef[];
  public readonly headings: readonly HeadingRef[];
  public readonly anchors: readonly AnchorRef[];
  public readonly images: readonly ImageRef[];
  /** Raw bodies of every `<script type="application/ld+json">`, unparsed. */
  public readonly jsonLdBlocks: readonly string[];
  public readonly scriptSources: readonly string[];
  /** All visible text, chrome included. */
  public readonly text: string;
  /** The page's own content: `<main>` where it exists, else chrome removed. */
  public readonly contentText: string;
  public readonly wordCount: number;
  public readonly contentWordCount: number;

  private constructor(init: {
    url: string;
    host: string;
    html: string;
    markup: string;
    headers: Record<string, string>;
    title: string | null;
    lang: string | null;
    meta: Record<string, string>;
    property: Record<string, string>;
    links: readonly LinkRef[];
    headings: readonly HeadingRef[];
    anchors: readonly AnchorRef[];
    images: readonly ImageRef[];
    jsonLdBlocks: readonly string[];
    scriptSources: readonly string[];
    text: string;
    contentText: string;
  }) {
    this.url = init.url;
    this.host = init.host;
    this.html = init.html;
    this.markup = init.markup;
    this.headers = Object.freeze({ ...init.headers });
    this.title = init.title;
    this.lang = init.lang;
    this.meta = Object.freeze({ ...init.meta });
    this.property = Object.freeze({ ...init.property });
    this.links = Object.freeze([...init.links]);
    this.headings = Object.freeze([...init.headings]);
    this.anchors = Object.freeze([...init.anchors]);
    this.images = Object.freeze([...init.images]);
    this.jsonLdBlocks = Object.freeze([...init.jsonLdBlocks]);
    this.scriptSources = Object.freeze([...init.scriptSources]);
    this.text = init.text;
    this.contentText = init.contentText;
    this.wordCount = wordCount(init.text);
    this.contentWordCount = wordCount(init.contentText);
    Object.freeze(this);
  }

  public static read(input: {
    url: string;
    html: string;
    headers?: Record<string, string>;
  }): PageDocument {
    const { html } = input;
    const markup = withoutCode(html);

    const meta: Record<string, string> = {};
    const property: Record<string, string> = {};
    for (const tag of readOpenTags(markup, 'meta')) {
      const content = readAttribute(tag, 'content');
      if (content === null) continue;
      const name = readAttribute(tag, 'name') ?? readAttribute(tag, 'http-equiv');
      if (name !== null) {
        const key = name.toLowerCase();
        meta[key] = content;

        // OpenGraph read from `name` as well as `property`. The spec says
        // `property`, and MDN ships `<meta name="og:title">`, which every real
        // consumer honours. Reading only the spec form reported the most
        // quotable reference page on the web as having no OpenGraph at all.
        if (key.startsWith('og:')) property[key] ??= content;
      }

      const prop = readAttribute(tag, 'property');
      if (prop !== null) property[prop.toLowerCase()] = content;
    }

    const links: LinkRef[] = [];
    for (const tag of readOpenTags(markup, 'link')) {
      const rel = readAttribute(tag, 'rel');
      const href = readAttribute(tag, 'href');
      if (rel === null || href === null) continue;
      links.push({ rel: rel.toLowerCase(), href, hreflang: readAttribute(tag, 'hreflang') });
    }

    const body = readElements(markup, 'body')[0] ?? markup;
    const content = contentRegion(body);

    const headings = headingsIn(body);

    const anchors: AnchorRef[] = [];
    for (const match of markup.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)) {
      const attrs = match[1] ?? '';
      anchors.push({
        href: readAttribute(`<a ${attrs}>`, 'href'),
        text: textOf(match[2] ?? ''),
        attrs,
      });
    }

    const images: ImageRef[] = [];
    for (const tag of readOpenTags(markup, 'img')) {
      const src = readAttribute(tag, 'src') ?? readAttribute(tag, 'data-src');
      if (src === null) continue;
      images.push({ src, alt: hasAlt(tag) ? (readAttribute(tag, 'alt') ?? '') : null });
    }

    const jsonLdBlocks: string[] = [];
    for (const match of html.matchAll(
      /<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script\s*>/gi,
    )) {
      const body = (match[1] ?? '').trim();
      if (body !== '') jsonLdBlocks.push(body);
    }

    const scriptSources = readOpenTags(html, 'script')
      .map((tag) => readAttribute(tag, 'src'))
      .filter((src): src is string => src !== null);

    return new PageDocument({
      url: input.url,
      host: hostOfUrl(input.url),
      html,
      markup,
      headers: input.headers ?? {},
      title: firstNonEmpty(readElements(markup, 'title').map((raw) => textOf(raw))),
      lang: readAttribute(readOpenTags(markup, 'html')[0] ?? '', 'lang'),
      meta,
      property,
      links,
      headings,
      anchors,
      images,
      jsonLdBlocks,
      scriptSources,
      text: textOf(body),
      contentText: textOf(content),
    });
  }

  /** A `<link rel>` may list several tokens, so this matches on the token. */
  public linkHref(rel: string): string | null {
    const found = this.links.find((link) => link.rel.split(/\s+/).includes(rel));
    return found?.href ?? null;
  }
}

const HEADING = /<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1\s*>/gi;

/**
 * The only two elements whose headings are reliably furniture.
 *
 * NOT `<header>`. The first attempt excluded everything `contentRegion` strips,
 * and lovable.dev's `<h1>` sits after `</main>` closes: the page was reported as
 * having no h1 at all, which is worse than the footer noise it was meant to fix.
 * A hero can live anywhere; a footer's column labels cannot be anything else.
 */
const FURNITURE = /<(footer|nav)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

/**
 * Every heading, tagged with whether it is part of the page's outline and
 * whether it is hidden from assistive technology.
 *
 * Membership is decided by POSITION rather than by matching markup: two
 * headings can be byte-for-byte identical (stripe.com layers a duplicate hero
 * `<h1>`), and any comparison by content puts both wherever the first one fell.
 */
function headingsIn(body: string): HeadingRef[] {
  const furniture: Array<[number, number]> = [];
  for (const match of body.matchAll(FURNITURE)) {
    furniture.push([match.index, match.index + match[0].length]);
  }

  const headings: HeadingRef[] = [];
  for (const match of body.matchAll(HEADING)) {
    const level = Number.parseInt(match[1] ?? '0', 10);
    if (level === 0) continue;
    const at = match.index;
    headings.push({
      level,
      text: textOf(match[3] ?? ''),
      inContent: !furniture.some(([from, to]) => at >= from && at < to),
      hidden: /\baria-hidden\s*=\s*["']?true/i.test(match[2] ?? ''),
    });
  }
  return headings;
}

function firstNonEmpty(values: readonly string[]): string | null {
  return values.find((value) => value !== '') ?? null;
}

function hostOfUrl(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

/**
 * Whether the tag carries an `alt` attribute at all, with or without a value.
 *
 * A bare `alt` is HTML5's empty attribute syntax and means exactly `alt=""`: an
 * image the author has deliberately marked decorative. Requiring `alt=` counted
 * that as missing, and apple.com/airpods writes `<img src="…" alt>` fourteen
 * times, so a page doing it correctly was told fourteen of its images had none.
 *
 * Anchored on the whitespace before the name, which is what stops `data-alt`
 * and a path like `/images/alt/` from matching.
 */
function hasAlt(tag: string): boolean {
  return /\salt(?=[\s=>/])/i.test(tag);
}
