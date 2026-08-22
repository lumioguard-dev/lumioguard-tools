/**
 * The explainers, as plain data. Here rather than `build/` because both read
 * it: the build writes the pages, and the app links them from the colophon,
 * which is the only copy a JavaScript-running crawler ever sees.
 */
export interface PageLink {
  /** Always starts with a slash, and is the path the document is written to. */
  readonly path: string;
  readonly title: string;
  readonly description: string;
}

export const PAGES: readonly PageLink[] = [
  {
    path: '/can-ai-cite-your-site',
    title: 'Can an answer engine cite your site?',
    description:
      'Most crawlers that feed answer engines do not run JavaScript. What they store for your URL is what your server sent, not what a browser assembles.',
  },
  {
    path: '/api-keys-in-frontend-code',
    title: 'What your frontend bundle gives away',
    description:
      'Everything an app ships to the browser is readable by anyone who opens it. Which keys actually matter, why row-level security is the real control, and what source maps publish.',
  },
  {
    path: '/what-ai-slop-looks-like',
    title: 'What AI slop actually looks like',
    description:
      'Generated sites converge on the same defaults. The specific tells: stock hero lines, bento grids, glow instead of shadow, and the vocabulary chatbots reach for.',
  },
  {
    path: '/how-the-scores-work',
    title: 'How the scores work',
    description:
      'Three readings on one 0-100 scale where higher is better, the published band ladders, and what each one was calibrated against.',
  },
];

/** The entry for one path, or a throw: a page with no link is a page nothing reaches. */
export function pageLink(path: string): PageLink {
  const found = PAGES.find((page) => page.path === path);
  if (found === undefined) throw new Error(`No page registered at "${path}"`);
  return found;
}
