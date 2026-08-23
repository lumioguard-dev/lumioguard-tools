import { useCallback, useEffect, useState } from 'react';
import { type ToolCopy, pageForPath } from '../../tools/catalogue.js';
import { DEFAULT_TOOL_IDS, TOOLS } from '../../tools/index.js';

const SITE = 'site';
const TOOLS_PARAM = 'tools';

/** What the address bar is currently asking for. */
export interface ConsoleRoute {
  readonly address: string | null;
  readonly toolIds: readonly string[];
  /** The reading this page runs alone, or null where it offers a choice. */
  readonly pinned: ToolCopy | null;
  /** The chooser scans nothing: it is the page that sends you to one that does. */
  readonly chooser: boolean;
}

/** The ways the page changes it, each writing history and re-reading. */
interface RouteControls {
  readonly open: (address: string) => void;
  readonly select: (ids: readonly string[]) => void;
  readonly clear: () => void;
}

/**
 * The reading lives at its own address. A query parameter, not a path: a path
 * needs the host to rewrite unknown routes and works on no static host by
 * default. The SELECTION rides along, or a shared link runs different tools.
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
    open: useCallback((next: string) => go((params) => params.set(SITE, next), true), [go]),
    // No scroll: changing the selection re-reads in place, and yanking the page
    // to the top on a checkbox loses whatever the reader was looking at.
    select: useCallback(
      (ids: readonly string[]) =>
        go((params) => {
          const ordered = TOOLS.filter((tool) => ids.includes(tool.id)).map((tool) => tool.id);
          if (ordered.length === 0 || ordered.length === TOOLS.length) params.delete(TOOLS_PARAM);
          else params.set(TOOLS_PARAM, ordered.join(','));
        }, false),
      [go],
    ),
    clear: useCallback(() => go((params) => params.delete(SITE), true), [go]),
  };
}

function read(): ConsoleRoute {
  const params = new URLSearchParams(window.location.search);

  const site = params.get(SITE);
  const address = site === null || site.trim() === '' ? null : site;

  // A tool page runs its own reading and nothing else. The path wins over the
  // parameter: the URL is the promise the page made, and a `?tools=` on it
  // would quietly read something the heading never offered.
  const page = pageForPath(window.location.pathname);
  if (page.kind === 'tool') {
    return { address, toolIds: [page.tool.id], pinned: page.tool, chooser: false };
  }

  const chooser = page.kind === 'choose';
  const raw = params.get(TOOLS_PARAM);
  if (raw === null) return { address, toolIds: DEFAULT_TOOL_IDS, pinned: null, chooser };

  const wanted = raw.split(',').map((id) => id.trim());
  const known = TOOLS.filter((tool) => wanted.includes(tool.id)).map((tool) => tool.id);
  return {
    address,
    toolIds: known.length === 0 ? DEFAULT_TOOL_IDS : known,
    pinned: null,
    chooser,
  };
}
