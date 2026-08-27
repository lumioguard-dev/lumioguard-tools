/**
 * What each reading is called and what it does, as plain data. Split out of the
 * descriptors so the BUILD can read it: a descriptor is a `.tsx` and the Vite
 * config runs in Node. Descriptors spread their entry, so the words cannot drift.
 */
export interface ToolCopy {
  /** Stable, lower-case, and the segment its dev proxy is mounted at. */
  readonly id: string;
  /**
   * What this reading IS, never what built it. A visitor picking what to read
   * is choosing between concerns, not between Slopmeter, Leakpeek and Citecheck.
   */
  readonly label: string;
  /** What this tool does, in ONE sentence. It is a tooltip, not a paragraph. */
  readonly summary: string;
  /**
   * Its own page, where this reading runs alone. Named for what a person would
   * search rather than for the engine behind it, and the file the build emits
   * takes its name from here.
   */
  readonly slug: string;
  /** The question that page asks, standing in for the home page's own. */
  readonly headline: string;
  /** What this reading looks for: the middle beat of how it works, on its own page. */
  readonly checks: string;
  /** What a search result shows for that page. Under 160 characters. */
  readonly description: string;
}

/** Slopmeter first: it is the one a visitor arrives wanting. */
export const CATALOGUE: readonly ToolCopy[] = [
  {
    id: 'slopmeter',
    label: 'AI slop',
    summary: 'See how much of the site feels templated.',
    slug: 'ai-slop-check',
    headline: 'Does this site feel original?',
    checks: 'We check for signs that make a website look like every other AI website',
    description:
      'Score any public site for the defaults generated sites ship with: stock hero lines, bento grids, glow instead of shadow, and the vocabulary chatbots reach for.',
  },
  {
    id: 'leakpeek',
    label: 'Security',
    summary: 'See what your site exposes publicly.',
    slug: 'security-check',
    headline: 'What is this site exposing?',
    checks: 'We check for surface-level security issues',
    description:
      'Read any public site for what it gives away: keys in the bundle, a database with no row-level security, source maps, and files served from the web root.',
  },
  {
    id: 'citecheck',
    label: 'SEO & AI visibility',
    summary: 'See what makes your site harder for search and AI to understand.',
    slug: 'seo-ai-visibility-check',
    headline: 'Can search engines and AI find this site?',
    checks: 'We check for things that make it hard for Google and AI agents to read your website',
    description:
      'Read any public site the way a crawler does: a body that is empty without JavaScript, crawlers turned away, and nothing an answer could be lifted from.',
  },
];

/** The entry for one tool, or a throw: a descriptor naming nothing is a defect. */
export function toolCopy(id: string): ToolCopy {
  const found = CATALOGUE.find((tool) => tool.id === id);
  if (found === undefined) throw new Error(`No catalogue entry for tool "${id}"`);
  return found;
}

/** Every reading at once, which is a page rather than a reading of its own. */
export const SCAN_SLUG = 'scan';

/** What has been read, ranked. Also a page rather than a reading. */
export const LEADERBOARD_SLUG = 'leaderboard';

/**
 * The board is the AI slop reading's own, so it sits under that reading's path
 * rather than at the root. Derived: renaming that slug moves the board with it.
 */
export const LEADERBOARD_TOOL = 'slopmeter';

/**
 * Which of the three documents a path is. The build reads it to know what to
 * prerender and the app to know what to run, and answered separately in each
 * they would disagree about a path and scan something the heading never offered.
 */
export type ConsolePage =
  | { readonly kind: 'tool'; readonly tool: ToolCopy }
  | { readonly kind: 'scan' }
  | { readonly kind: 'leaderboard' }
  | { readonly kind: 'choose' };

/** The last path segment, however the app is mounted and whether or not `.html`. */
function segment(pathname: string): string {
  const last = pathname.replace(/\/+$/, '').split('/').pop() ?? '';
  return last.replace(/\.html$/, '');
}

/** Anything unrecognised is the chooser, never a scanner with no reading. */
export function pageForPath(pathname: string): ConsolePage {
  const slug = segment(pathname);
  const tool = CATALOGUE.find((entry) => entry.slug === slug);
  if (tool !== undefined) return { kind: 'tool', tool };
  if (slug === SCAN_SLUG) return { kind: 'scan' };
  if (slug === LEADERBOARD_SLUG) return { kind: 'leaderboard' };
  return { kind: 'choose' };
}

/**
 * What a page is called where a name is wanted rather than a route: analytics,
 * chiefly. A `Record` rather than a `switch`, so a fourth kind of page fails to
 * compile here instead of reporting itself as `undefined`.
 */
const PAGE_NAME: Record<Exclude<ConsolePage['kind'], 'tool'>, string> = {
  scan: SCAN_SLUG,
  leaderboard: LEADERBOARD_SLUG,
  choose: 'choose',
};

export function pageName(page: ConsolePage): string {
  return page.kind === 'tool' ? page.tool.slug : PAGE_NAME[page.kind];
}

/** Where the board lives: under the reading it ranks. */
export function leaderboardPath(): string {
  return `/${toolCopy(LEADERBOARD_TOOL).slug}/${LEADERBOARD_SLUG}`;
}
