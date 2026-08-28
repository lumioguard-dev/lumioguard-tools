import { useCallback, useEffect, useState } from 'react';
import { type ToolCopy, pageForPath, pageName } from '../../tools/catalogue.js';
import { DEFAULT_TOOL_IDS, TOOLS } from '../../tools/index.js';

/**
 * The address rides in the query, so it is in every URL the page records about
 * itself. Exported because analytics strips it back out, and two spellings of it
 * could not fail together.
 */
export const SITE_PARAM = 'site';
const TOOLS_PARAM = 'tools';

export interface ConsoleRoute {
  readonly address: string | null;
  readonly toolIds: readonly string[];
  /** The reading this page runs alone, or null where it offers a choice. */
  readonly pinned: ToolCopy | null;
  /** The chooser scans nothing: it sends you to a page that does. */
  readonly chooser: boolean;
  /** The board scans nothing either: it ranks what has already been read. */
  readonly board: boolean;
  readonly pageName: string;
}

/** Each writes history and re-reads. */
interface RouteControls {
  readonly open: (address: string) => void;
  readonly select: (ids: readonly string[]) => void;
  readonly clear: () => void;
}

/**
 * A query parameter, not a path: a path needs the host to rewrite unknown routes
 * and works on no static host by default. The SELECTION rides along, or a shared
 * link runs different tools.
 */
export function useConsoleRoute(): ConsoleRoute & RouteControls {
  const [route, setRoute] = useState<ConsoleRoute>(read);

  useEffect(() => {
    const onPop = (): void => setRoute(read());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = useCallback((mutate: (params: URLSearchParams) => void, scroll: boolean) => {
    const url = new URL(window.location.href);
    mutate(url.searchParams);
    window.history.pushState({}, '', url);
    setRoute(read());
    if (scroll) window.scrollTo({ top: 0 });
  }, []);

  return {
    address: route.address,
    toolIds: route.toolIds,
    pinned: route.pinned,
    chooser: route.chooser,
    board: route.board,
    pageName: route.pageName,
    open: useCallback((next: string) => go((params) => params.set(SITE_PARAM, next), true), [go]),
    // No scroll: yanking the page to the top on a checkbox loses the reader's place.
    select: useCallback(
      (ids: readonly string[]) =>
        go((params) => {
          const ordered = TOOLS.filter((tool) => ids.includes(tool.id)).map((tool) => tool.id);
          if (ordered.length === 0 || ordered.length === TOOLS.length) params.delete(TOOLS_PARAM);
          else params.set(TOOLS_PARAM, ordered.join(','));
        }, false),
      [go],
    ),
    clear: useCallback(() => go((params) => params.delete(SITE_PARAM), true), [go]),
  };
}

function read(): ConsoleRoute {
  const params = new URLSearchParams(window.location.search);

  const site = params.get(SITE_PARAM);
  const address = site === null || site.trim() === '' ? null : site;

  // The path WINS over the parameter: the URL is the promise the page made, and a
  // `?tools=` on it would quietly read something the heading never offered.
  const page = pageForPath(window.location.pathname);
  const name = pageName(page);
  if (page.kind === 'tool') {
    return {
      address,
      toolIds: [page.tool.id],
      pinned: page.tool,
      chooser: false,
      board: false,
      pageName: name,
    };
  }

  const chooser = page.kind === 'choose';
  const board = page.kind === 'leaderboard';
  const raw = params.get(TOOLS_PARAM);
  if (raw === null) {
    return { address, toolIds: DEFAULT_TOOL_IDS, pinned: null, chooser, board, pageName: name };
  }

  const wanted = raw.split(',').map((id) => id.trim());
  const known = TOOLS.filter((tool) => wanted.includes(tool.id)).map((tool) => tool.id);
  return {
    address,
    toolIds: known.length === 0 ? DEFAULT_TOOL_IDS : known,
    pinned: null,
    chooser,
    board,
    pageName: name,
  };
}
