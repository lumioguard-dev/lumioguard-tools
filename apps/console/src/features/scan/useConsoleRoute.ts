import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_TOOL_IDS, TOOLS } from '../../tools/index.js';

const SITE = 'site';
const TOOLS_PARAM = 'tools';

interface Route {
  readonly address: string | null;
  readonly toolIds: readonly string[];
}

/**
 * The reading lives at its own address. A query parameter, not a path: a path
 * needs the host to rewrite unknown routes and works on no static host by
 * default. The SELECTION rides along, or a shared link runs different tools.
 */
export function useConsoleRoute(): {
  readonly address: string | null;
  readonly toolIds: readonly string[];
  readonly open: (address: string) => void;
  readonly select: (ids: readonly string[]) => void;
  readonly clear: () => void;
} {
  const [route, setRoute] = useState<Route>(read);

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

function read(): Route {
  const params = new URLSearchParams(window.location.search);

  const site = params.get(SITE);
  const address = site === null || site.trim() === '' ? null : site;

  const raw = params.get(TOOLS_PARAM);
  if (raw === null) return { address, toolIds: DEFAULT_TOOL_IDS };

  const wanted = raw.split(',').map((id) => id.trim());
  const known = TOOLS.filter((tool) => wanted.includes(tool.id)).map((tool) => tool.id);
  return { address, toolIds: known.length === 0 ? DEFAULT_TOOL_IDS : known };
}
