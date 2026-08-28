import type { Rendering } from '@lumioguard/shared';
import { type CiteFinding, finding, quote, when } from '../domain/CiteFinding.js';
import type { PageDocument } from '../read/PageDocument.js';

/**
 * The mount point an SPA leaves empty. Matched CLOSED AND EMPTY, never by id
 * alone: a server-rendered Next.js page has one too. THE QUOTES ARE REQUIRED,
 * or the alternation matches a prefix and cnn.com is called a shell.
 */
const EMPTY_MOUNT =
  /<div\b[^>]*\bid\s*=\s*["'](?:root|app|__next|__nuxt|___gatsby|svelte)["'][^>]*>\s*<\/div\s*>/i;

/** Markers that say a framework runs here, whatever it rendered. */
const FRAMEWORK_MARKERS: readonly RegExp[] = [
  /__NEXT_DATA__/,
  /data-reactroot/,
  /\bid=["']?__nuxt["']?/i,
  /\bng-version\b/i,
  /\bdata-svelte-h\b/i,
  /window\.__remixContext/,
];

/**
 * Below this the whole document carries no prose at all. The WHOLE BODY, not the
 * content region: at 40 words of the content region, canva.com's `<main>` of
 * seventeen words in a 1,114-word page read as empty. A blocker must be unarguable.
 */
const SHELL_WORD_FLOOR = 12;

export interface RenderingRead {
  readonly rendering: Rendering;
  readonly findings: readonly CiteFinding[];
}

export function readRendering(page: PageDocument): RenderingRead {
  const emptyMount = page.markup.match(EMPTY_MOUNT);
  // The markers are script contents by nature, so this one reads the RAW html.
  const framework = FRAMEWORK_MARKERS.some((marker) => marker.test(page.html));

  const isShell = emptyMount !== null || (framework && page.wordCount < SHELL_WORD_FLOOR);
  const rendering: Rendering = isShell ? 'shell' : framework ? 'hydrated' : 'served';

  return {
    rendering,
    findings: when(isShell, () =>
      finding({
        code: 'access.shell',
        impact: 'blocker',
        area: 'access',
        title: 'The page is empty until JavaScript runs',
        detail:
          'What the server sent carries no readable content. A browser fills it in; most crawlers that feed answer engines do not run JavaScript, so what they store for this URL is a blank document.',
        evidence:
          emptyMount === null ? `${page.wordCount} words in the served HTML` : quote(emptyMount[0]),
        fix: 'Server-render or pre-render the page so its content is in the first response.',
      }),
    ),
  };
}
