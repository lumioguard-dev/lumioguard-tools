import { decodeEntities } from './TagReader.js';

const CONTAINER_TAGS = ['script', 'style', 'noscript', 'svg'] as const;

/**
 * Truncation ignores element boundaries, so a cut page can end inside a
 * `<script>`.
 */
function cutUnterminatedTail(html: string): string {
  const lower = html.toLowerCase();
  let cut = html.length;
  for (const tag of CONTAINER_TAGS) {
    const open = lower.lastIndexOf(`<${tag}`);
    if (open === -1) continue;
    if (lower.lastIndexOf(`</${tag}>`) < open) cut = Math.min(cut, open);
  }
  return cut === html.length ? html : html.slice(0, cut);
}

export class TextContent {
  public readonly text: string;
  public readonly lower: string;
  /** The same text with code samples taken out. */
  public readonly prose: string;
  /**
   * The body is built client-side, so what was fetched is a shell.
   * instagram.com ships 9 characters of text in 595KB of HTML: "no h1" then
   * describes the fetch, not the page.
   */
  public readonly isClientRendered: boolean;

  private constructor(text: string, prose: string, isClientRendered: boolean) {
    this.text = text;
    this.lower = text.toLowerCase();
    this.prose = prose;
    this.isClientRendered = isClientRendered;
    Object.freeze(this);
  }

  public static from(html: string, rawByteLength: number): TextContent {
    const stripped = cutUnterminatedTail(html)
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ');

    const text = decodeEntities(stripped.replace(/<[^>]+>/g, ' '))
      .replace(/\s+/g, ' ')
      .trim();

    const prose = decodeEntities(
      stripped
        .replace(/<pre\b[\s\S]*?<\/pre>/gi, ' ')
        .replace(/<code\b[\s\S]*?<\/code>/gi, ' ')
        .replace(/<samp\b[\s\S]*?<\/samp>/gi, ' ')
        .replace(/<kbd\b[\s\S]*?<\/kbd>/gi, ' ')
        .replace(/<[^>]+>/g, ' '),
    )
      .replace(/\s+/g, ' ')
      .trim();

    return new TextContent(text, prose, text.length < 700 && rawByteLength > 3000);
  }
}
