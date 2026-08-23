/**
 * The console's own words, read by the app when it renders and by the build
 * when it writes the document a crawler is served. Typed into both they could
 * differ, and text that does not match what a reader sees is cloaking.
 */

/** The app's own name. The parent's is optional and may be absent entirely. */
export const NAME = 'Readout';

/**
 * The heading, split where it must not wrap: the tail is held on one line so
 * the question mark never lands by itself. Joined by a space they are the
 * heading a machine reads, so the split is typesetting and nothing more.
 */
export const HEADLINE = { lead: 'Let’s start with', tail: 'your site' } as const;

export const HEADLINE_TEXT = `${HEADLINE.lead} ${HEADLINE.tail}`;

/**
 * What a search result shows, which is no longer the heading: a greeting reads
 * well on arrival and ranks for nothing. A title has to say what the page is to
 * somebody who has not arrived yet.
 */
export const TITLE = `${NAME}, what does this site give away?`;

/**
 * The one sentence that works as meta description, OpenGraph card, structured
 * data and static document. Under 160 characters, where a search result stops
 * showing it, which `build/__tests__/head.test.ts` asserts.
 */
export const DESCRIPTION =
  'See what your website reveals, what it exposes, and how well search and AI can understand it.';

/**
 * Sites everyone knows, chosen because their readings disagree: a consolidated
 * verdict is only worth drawing when the parts can differ, and nytimes.com
 * answers a crawler with 403 while serving a browser normally.
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

/** The all-readings page, which is a different promise from the chooser's. */
export const SCAN = {
  headline: 'Read a site with every check at once',
  description:
    'Run all three readings on one URL and land on a single verdict: the worst of them, with each reading underneath it.',
} as const;

/** Who the colophon credits, and who the structured data names as publisher. */
export const PUBLISHER = 'Lumio Software FZ LLC';
