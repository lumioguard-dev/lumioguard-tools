import { useCallback, useEffect, useState } from 'react';

const PARAM = 'site';

/**
 * The reading lives at its own address, so it can be shared, reloaded and backed
 * out of. A query parameter rather than a path segment: a path needs the host to
 * rewrite unknown routes to the app shell, and getting that wrong turns every
 * shared link into a 404. This works on any static host.
 */
export function useSiteRoute(): {
  readonly address: string | null;
  readonly open: (address: string) => void;
  readonly clear: () => void;
} {
  const [address, setAddress] = useState<string | null>(read);

  useEffect(() => {
    const onPop = (): void => setAddress(read());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = useCallback((mutate: (params: URLSearchParams) => void) => {
    const url = new URL(window.location.href);
    mutate(url.searchParams);
    window.history.pushState({}, '', url);
    setAddress(read());
    window.scrollTo({ top: 0 });
  }, []);

  return {
    address,
    open: useCallback((next: string) => go((params) => params.set(PARAM, next)), [go]),
    clear: useCallback(() => go((params) => params.delete(PARAM)), [go]),
  };
}

function read(): string | null {
  const value = new URLSearchParams(window.location.search).get(PARAM);
  return value === null || value.trim() === '' ? null : value;
}
