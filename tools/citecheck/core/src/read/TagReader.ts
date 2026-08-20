// Regex tag scanning, not a DOM: a Worker has no parser and this must stay
// cheap enough to run on every page of a crawl.

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: ', ',
  ndash: '-',
  hellip: '...',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  copy: '©',
  reg: '®',
  trade: '™',
};

function safeChar(code: number): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return '';
  try {
    return String.fromCodePoint(code);
  } catch {
    return '';
  }
}

export function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => safeChar(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => safeChar(Number.parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (match, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

export function readAttribute(tag: string, name: string): string | null {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const match = tag.match(pattern);
  if (match === null) return null;
  return decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
}

export function readOpenTags(html: string, tagName: string): string[] {
  return html.match(new RegExp(`<${tagName}\\b[^>]*>`, 'gi')) ?? [];
}

/**
 * The inner HTML of every `<tag>...</tag>` pair, non-greedy.
 *
 * Non-greedy so two sibling `<nav>` blocks are two matches rather than one that
 * swallows everything between them. Nesting is not handled and does not need to
 * be: what this is used for is stripping regions and reading leaf text.
 */
export function readElements(html: string, tagName: string): string[] {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)</${tagName}\\s*>`, 'gi');
  return [...html.matchAll(pattern)].map((match) => match[1] ?? '');
}

/** Script and style hold code, so their contents are never page text. */
const NON_TEXT = /<(script|style|template|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

const COMMENT = /<!--[\s\S]*?-->/g;

/**
 * The document with its code removed, for anything that reads ELEMENTS.
 *
 * A `<script>` holding a client-side template contains angle brackets that look
 * exactly like markup, and a regex scanner cannot tell them apart. cnn.com's
 * only `<h1>` is a string inside a Handlebars template: the page was read as
 * having a heading whose text began `'+(null!=(t=p(e,"if")`, and eight of its
 * twenty-nine headings were JavaScript rather than document structure.
 *
 * Anything that genuinely wants the code, a framework marker or the JSON-LD
 * blocks or the script sources, reads the raw HTML instead.
 */
export function withoutCode(html: string): string {
  return html.replace(COMMENT, ' ').replace(NON_TEXT, ' ');
}

/** Markup out, entities decoded, runs of whitespace collapsed to one space. */
export function textOf(html: string): string {
  return decodeEntities(
    html
      .replace(COMMENT, ' ')
      .replace(NON_TEXT, ' ')
      .replace(/<[^>]*>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

/** Words, for any measure that has to be comparable across pages. */
export function wordCount(text: string): number {
  if (text === '') return 0;
  return text.split(/\s+/).filter((word) => /[a-z0-9]/i.test(word)).length;
}

/** The regions a page repeats on every URL, and an extractor must discount. */
const CHROME_TAGS = ['header', 'nav', 'footer', 'aside'] as const;

/**
 * The page minus its chrome.
 *
 * `<main>` wins outright when the page marks one, because that is the author
 * saying where their content is. Otherwise the chrome elements are cut, which
 * is a weaker guess but the only one available on a page with no landmarks.
 *
 * A share threshold was tried here, on the theory that a `<main>` holding a
 * minority of the words is mislabelled. Measured across seven sites it moved
 * exactly one, vercel.com, from 230 words to 141 and invented a boilerplate
 * finding out of the difference. Every other `<main>` in the corpus held 74%
 * or more. The author's own mark beats a guess about it.
 */
export function contentRegion(html: string): string {
  const first = readElements(html, 'main')[0];
  if (first !== undefined && first.trim() !== '') return first;

  let remaining = html;
  for (const tag of CHROME_TAGS) {
    remaining = remaining.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}\\s*>`, 'gi'), ' ');
  }
  return remaining;
}
