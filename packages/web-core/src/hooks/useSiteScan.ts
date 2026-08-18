import { useEffect, useRef, useState } from 'react';
import { ScanApiError } from '../api/ApiClient.js';

export interface SiteScanState<T> {
  readonly result: T | null;
  readonly error: string | null;
  readonly isScanning: boolean;
}

/** What a tool's client does with an address. The hook owns everything else. */
export type RunScan<T> = (address: string, signal: AbortSignal) => Promise<T>;

/**
 * The address is the state, so the read starts from the URL rather than from a
 * click. Landing on a shared link runs the same scan the button would have.
 *
 * One reading at a time: changing address aborts the last, and an aborted
 * request writes nothing. Without that guard a slow first scan lands after a
 * fast second one and silently replaces the newer reading.
 */
export function useSiteScan<T>(address: string, run: RunScan<T>): SiteScanState<T> {
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  // Held in a ref so the ADDRESS alone drives the effect. Callers pass an inline
  // arrow, whose identity changes every render — as a dependency it would abort
  // and restart the scan on each one.
  const runRef = useRef(run);
  runRef.current = run;

  useEffect(() => {
    const controller = new AbortController();
    setIsScanning(true);
    setError(null);
    setResult(null);

    void runRef
      .current(address, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setResult(data);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          caught instanceof ScanApiError
            ? caught.message
            : 'That address could not be read. Check it and try again.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsScanning(false);
      });

    return () => controller.abort();
  }, [address]);

  return { result, error, isScanning };
}
