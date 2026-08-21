import { type CiteFinding, finding, quote, when } from '../domain/CiteFinding.js';

/** The second fetch, made with a crawler's user agent instead of a browser's. */
export interface AgentView {
  readonly status: number;
  readonly contentWordCount: number;
  /** The user agent that was sent, so the finding can name what was refused. */
  readonly userAgent: string;
}

/**
 * Below this share of the browser's words, the crawler was served a different
 * page rather than a slightly different one. Half is generous on purpose: a
 * page that varies its content by visitor legitimately differs a little, and a
 * tighter ratio would report that as cloaking.
 */
const THIN_RATIO = 0.5;

/**
 * Below this share, the crawler was served nothing rather than less. A page
 * stripped to a tenth of itself is not a worse citation, it is an impossible
 * one, and grading that as the same finding as a slightly shorter page put a
 * silently emptied response a rung below the shell it amounts to.
 */
const EMPTY_RATIO = 0.1;

/**
 * What the site serves a crawler, against what it serves a browser.
 *
 * This is the check nobody runs on themselves, and the one that catches the
 * most expensive accident in the set: a bot filter installed for scrapers, now
 * returning 403 to every agent that would have cited the page. The site looks
 * perfect in a browser, which is the only place its owner ever looks.
 */
export function checkCloaking(browserWords: number, agent: AgentView | null): CiteFinding[] {
  if (agent === null) return [];

  const refused = agent.status === 403 || agent.status === 429 || agent.status === 401;

  return [
    ...when(refused, () =>
      finding({
        code: 'access.agent-refused',
        impact: 'blocker',
        area: 'access',
        title: 'The site refuses crawlers it serves to browsers',
        detail:
          'The same URL answered a browser and turned away a request identifying itself as a crawler. Usually a bot filter doing its job too well: the page is fine, and nothing that answers questions can reach it.',
        evidence: quote(`${agent.status} for ${agent.userAgent}`),
        fix: 'Allow the AI and search crawlers you want through your bot filter or WAF.',
      }),
    ),
    // Graded on how much was withheld: most of it is a defect, nearly all of it
    // is the page not existing for anything that is not a browser.
    ...when(
      !refused && browserWords > 0 && agent.contentWordCount < browserWords * THIN_RATIO,
      () => {
        const evidence = quote(
          `${agent.contentWordCount} words as a crawler against ${browserWords} as a browser`,
        );
        return agent.contentWordCount < browserWords * EMPTY_RATIO
          ? finding({
              code: 'access.agent-emptied',
              impact: 'blocker',
              area: 'access',
              title: 'Crawlers are served an all but empty page',
              detail:
                'The same URL answered a browser with a page and a crawler with almost nothing. It was not refused, so nothing logs an error: what gets stored for this URL is simply blank.',
              evidence,
              fix: 'Serve the same content to both, and check what your CDN varies on the user agent.',
            })
          : finding({
              code: 'access.agent-thin',
              impact: 'major',
              area: 'access',
              title: 'Crawlers are served less of the page than browsers',
              detail:
                'The crawler request came back with materially less content than the browser request. Whatever the reason, what gets stored and quoted is the shorter version.',
              evidence,
              fix: 'Serve the same content to both, or check what your CDN varies on the user agent.',
            });
      },
    ),
  ];
}
