/**
 * Split out of the descriptors so the BUILD can read it: a descriptor is a `.tsx`
 * and the Vite config runs in Node. Descriptors spread their entry from here, so
 * the words cannot drift.
 */
export interface ToolCopy {
  /** Stable, lower-case, and the segment its dev proxy is mounted at. */
  readonly id: string;
  /** What this reading IS, never what built it: a visitor chooses between concerns. */
  readonly label: string;
  /** ONE sentence. It is a tooltip, not a paragraph. */
  readonly summary: string;
  /** Named for what a person would search, and the emitted file takes its name. */
  readonly slug: string;
  /** The question that page asks, standing in for the home page's own. */
  readonly headline: string;
  /** The middle beat of how it works, on this reading's own page. */
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

/** Throws: a descriptor naming nothing is a defect. */
export function toolCopy(id: string): ToolCopy {
  const found = CATALOGUE.find((tool) => tool.id === id);
  if (found === undefined) throw new Error(`No catalogue entry for tool "${id}"`);
  return found;
}

/** A page rather than a reading of its own. */
export const SCAN_SLUG = 'scan';

/** A page rather than a reading too. */
export const LEADERBOARD_SLUG = 'leaderboard';

/**
 * The board is the AI slop reading's own, so it sits under that reading's path
 * rather than at the root. Derived: renaming that slug moves the board with it.
 */
export const LEADERBOARD_TOOL = 'slopmeter';

/**
 * The build reads this to know what to prerender and the app to know what to run.
 * Answered separately in each, they would disagree about a path and scan something
 * the heading never offered.
 */
export type ConsolePage =
  | { readonly kind: 'tool'; readonly tool: ToolCopy }
  | { readonly kind: 'scan' }
  | { readonly kind: 'leaderboard' }
  | { readonly kind: 'choose' };

/** However the app is mounted, and whether or not `.html`. */
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

/** A `Record`, not a `switch`: a fourth kind of page fails to compile here. */
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
