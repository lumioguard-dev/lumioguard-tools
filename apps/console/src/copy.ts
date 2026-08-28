/**
 * Read by the app when it renders AND by the build when it writes the document a
 * crawler is served. Typed into both they could differ, and text that does not
 * match what a reader sees is cloaking.
 */

/** Split where it must not wrap, so the tail never falls to a line of its own. */
export const HEADLINE = { lead: 'Let’s start with', tail: 'your site' } as const;

export const HEADLINE_TEXT = `${HEADLINE.lead} ${HEADLINE.tail}`;

/** Not the heading: a greeting reads well on arrival and ranks for nothing. */
export const TITLE = 'What does this site give away?';

/**
 * Under 160 characters, where a search result stops showing it, which
 * `build/__tests__/head.test.ts` asserts.
 */
export const DESCRIPTION =
  'See what your website reveals, what it exposes, and how well search and AI can understand it.';

/**
 * Chosen because their readings DISAGREE: a consolidated verdict is only worth
 * drawing when the parts can differ, and nytimes.com answers a crawler with 403.
 */
export const EXAMPLES: readonly string[] = ['apple.com', 'figma.com', 'nytimes.com'];

/** No tool count: the registry decides how many there are, and a number here rots. */
export const HOW_IT_WORKS = {
  paste: 'Paste a URL',
  read: 'Every reading you picked runs at once, each against its own engine',
  result: 'You get the verdict with the reasons',
} as const;

/**
 * Written once: the app and the prerendered shell both read this, and typed into
 * each they could tell a visitor two different things about one page.
 */
export function beats(checks?: string): {
  readonly paste: string;
  readonly read: string;
  readonly result: string;
} {
  return { ...HOW_IT_WORKS, read: checks ?? HOW_IT_WORKS.read };
}

export const SCAN = {
  headline: 'Read a site with every check at once',
  description:
    'Run all three readings on one URL and land on a single verdict: the worst of them, with each reading underneath it.',
} as const;

export const LEADERBOARD = {
  headline: 'Which sites look least like every other AI site?',
  description:
    'Every site read so far, ranked both ways: the most original, and the ones still wearing the template. One row per site, its latest reading.',
} as const;

export const PUBLISHER = 'Lumio Software FZ LLC';
