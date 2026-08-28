// Regex tag scanning, not a DOM: a Worker has no parser and this must stay
// cheap enough to run on every page of a crawl.

import { decodeEntities as decode } from '@lumioguard/shared';

/**
 * Read as plain text an answer engine could quote, so the en dash and the
 * ellipsis come back ASCII. The rest of the table is shared.
 */
const ASCII_PUNCTUATION: Readonly<Record<string, string>> = {
  ndash: '-',
  hellip: '...',
};

function decodeEntities(input: string): string {
  return decode(input, ASCII_PUNCTUATION);
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
 * Non-greedy, so two sibling `<nav>` blocks are two matches rather than one
 * swallowing everything between them. Nesting is not handled and need not be:
 * this strips regions and reads leaf text.
 */
export function readElements(html: string, tagName: string): string[] {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)</${tagName}\\s*>`, 'gi');
  return [...html.matchAll(pattern)].map((match) => match[1] ?? '');
}

/** Script and style hold code, so their contents are never page text. */
const NON_TEXT = /<(script|style|template|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

const COMMENT = /<!--[\s\S]*?-->/g;

/**
 * The document with its code removed, for anything that reads ELEMENTS. A
 * `<script>` holding a client-side template contains angle brackets a regex
 * cannot tell from markup: cnn.com's only `<h1>` is a Handlebars string.
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
 * `<main>` wins outright when the page marks one, because that is the author
 * saying where their content is. A share threshold was tried and moved exactly
 * one site of seven, inventing a boilerplate finding out of the difference.
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
