import { useCallback, useEffect, useState } from 'react';

const PARAM = 'site';
const VIEW = 'view';
const PAGES = 'pages';

interface Route {
  readonly address: string | null;
  readonly showPages: boolean;
}

function routeFromLocation(): Route {
  const params = new URLSearchParams(window.location.search);
  const value = params.get(PARAM);
  return {
    address: value === null || value.trim() === '' ? null : value,
    showPages: params.get(VIEW) === PAGES,
  };
}

/**
 * The reading lives at its own address, so it can be shared, reloaded and
 * backed out of.
 *
 * A query parameter rather than a path segment: a path needs the host to rewrite
 * unknown routes to the app shell, and getting that wrong turns every shared
 * link into a 404 on the day it is deployed. This works on any static host.
 */
export function useSiteRoute(): Route & {
  readonly open: (address: string) => void;
  readonly clear: () => void;
  readonly openPages: () => void;
  readonly closePages: () => void;
} {
  const [route, setRoute] = useState<Route>(routeFromLocation);

  useEffect(() => {
    const onPop = (): void => setRoute(routeFromLocation());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = useCallback((mutate: (params: URLSearchParams) => void) => {
    const url = new URL(window.location.href);
    mutate(url.searchParams);
    window.history.pushState({}, '', url);
    setRoute(routeFromLocation());
    window.scrollTo({ top: 0 });
  }, []);

  return {
    ...route,
    open: useCallback(
      (next: string) =>
        go((params) => {
          params.set(PARAM, next);
          params.delete(VIEW);
        }),
      [go],
    ),
    clear: useCallback(
      () =>
        go((params) => {
          params.delete(PARAM);
          params.delete(VIEW);
        }),
      [go],
    ),
    openPages: useCallback(() => go((params) => params.set(VIEW, PAGES)), [go]),
    closePages: useCallback(() => go((params) => params.delete(VIEW)), [go]),
  };
}
