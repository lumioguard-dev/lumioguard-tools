/**
 * The console's own words.
 *
 * Read twice: by the app when it renders, and by the build when it writes the
 * document a crawler is served. Typed into both they could differ, and served
 * text that does not match what a reader sees is what Citecheck calls cloaking.
 */

/** The app's own name. The parent's is optional and may be absent entirely. */
export const NAME = 'Readout';

/**
 * The heading, split where it must not wrap: the tail is held on one line so
 * the question mark never lands by itself. Joined by a space they are the
 * heading a machine reads, so the split is typesetting and nothing more.
 */
export const HEADLINE = { lead: 'What does this site', tail: 'give away?' } as const;

export const HEADLINE_TEXT = `${HEADLINE.lead} ${HEADLINE.tail}`;

/**
 * The name, then the question the page asks. Derived rather than typed: it was
 * the heading written out a second time, where retitling one left the other
 * saying something the page no longer asks.
 */
export const TITLE = `${NAME}, ${HEADLINE_TEXT[0]?.toLowerCase() ?? ''}${HEADLINE_TEXT.slice(1)}`;

/**
 * The one sentence that has to work as the meta description, the OpenGraph
 * card, the structured data and the static document.
 *
 * Held under 160 characters, where a search result stops showing it, which
 * `build/__tests__/head.test.ts` asserts. Citecheck's own floor of 25 is far
 * below; the ceiling is the one that bites.
 */
export const DESCRIPTION =
  'Read any public site and land on one verdict: how much came from a template, what it exposes to anyone with the URL, and whether an answer engine can quote it.';

/**
 * Sites everyone knows, chosen because their readings disagree with each other.
 * A consolidated verdict is only worth drawing when the parts can differ, and
 * nytimes.com answering a crawler with 403 while serving a browser normally
 * shows that in one click.
 */
export const EXAMPLES: readonly string[] = ['apple.com', 'figma.com', 'nytimes.com'];

/**
 * The three beats. No tool count: the registry decides how many there are, and
 * a number typed here would describe whatever was true the day it was written.
 */
export const HOW_IT_WORKS = {
  paste: 'Paste a URL',
  read: 'Every reading you picked runs at once, each against its own engine',
  result: 'One verdict, the worst of them, with each reading underneath',
} as const;

/** Who the colophon credits, and who the structured data names as publisher. */
export const PUBLISHER = 'Lumio Software FZ LLC';
