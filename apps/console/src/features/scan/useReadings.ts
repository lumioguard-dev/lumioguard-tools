import { ScanApiError } from '@lumioguard/web-core';
import { useEffect, useRef, useState } from 'react';
import type { ToolDescriptor, ToolOutcome } from '../../tools/registry.js';

export interface Reading {
  readonly tool: ToolDescriptor;
  /** Null while this tool is still reading, and after it fails. */
  readonly outcome: ToolOutcome | null;
  /** What went wrong, in words a visitor can act on. Null while it is fine. */
  readonly error: string | null;
  readonly isReading: boolean;
}

export interface ReadingsState {
  readonly readings: readonly Reading[];
  /** True until every selected tool has landed or failed. */
  readonly isReading: boolean;
}

function messageFor(caught: unknown): string {
  return caught instanceof ScanApiError
    ? caught.message
    : 'That address could not be read. Check it and try again.';
}

/**
 * Every selected tool at once, each landing on its own: awaiting them together
 * holds the fastest behind the slowest, and one dead tool takes the page. A new
 * address aborts everything in flight, or a slow first reading replaces a fast
 * second one.
 */
export function useReadings(address: string, tools: readonly ToolDescriptor[]): ReadingsState {
  const [readings, setReadings] = useState<readonly Reading[]>([]);

  // Held in a ref so the ADDRESS and the SELECTION drive the effect. The array
  // itself is rebuilt on every render, and as a dependency it would abort and
  // restart every reading on each one.
  const toolsRef = useRef(tools);
  toolsRef.current = tools;
  const selection = tools.map((tool) => tool.id).join(',');

  useEffect(() => {
    const controller = new AbortController();
    // Filtered by the KEY that triggered this run, not taken from the ref
    // wholesale: the ref is written on every render and can already hold a
    // newer selection than the one this effect was scheduled for.
    const wanted = selection.split(',');
    const running = toolsRef.current.filter((tool) => wanted.includes(tool.id));
    setReadings(running.map((tool) => ({ tool, outcome: null, error: null, isReading: true })));

    for (const tool of running) {
      void tool
        .run(address, controller.signal)
        .then((outcome) => {
          if (controller.signal.aborted) return;
          setReadings((current) =>
            current.map((reading) =>
              reading.tool.id === tool.id ? { ...reading, outcome, isReading: false } : reading,
            ),
          );
        })
        .catch((caught: unknown) => {
          if (controller.signal.aborted) return;
          setReadings((current) =>
            current.map((reading) =>
              reading.tool.id === tool.id
                ? { ...reading, error: messageFor(caught), isReading: false }
                : reading,
            ),
          );
        });
    }

    return () => controller.abort();
  }, [address, selection]);

  return { readings, isReading: readings.some((reading) => reading.isReading) };
}
