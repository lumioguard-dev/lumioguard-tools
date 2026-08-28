import { Panel } from '@lumioguard/ui';
import type { Reading } from '../scan/useReadings.js';

/**
 * Shared with the panel shown when NOTHING could be read: two lists of the same
 * failures would let one start naming tools the other did not.
 */
export function FailureList({
  readings,
  className,
}: {
  readonly readings: readonly Reading[];
  readonly className: string;
}): JSX.Element {
  return (
    <ul className={`flex list-none flex-col gap-1 p-0 ${className}`}>
      {readings.map((reading) => (
        <li key={reading.tool.id} className="text-13 leading-[1.5] text-ink-3">
          <span className="font-semibold text-ink-2">{reading.tool.label}</span>: {reading.error}
        </li>
      ))}
    </ul>
  );
}

/**
 * Each tool answers its own origin, so one being refused says nothing about the
 * others. Without this the verdict is drawn from whatever landed and the reader
 * has no way to know it was partial.
 */
export function FailedReadings({
  readings,
}: {
  readonly readings: readonly Reading[];
}): JSX.Element | null {
  const failed = readings.filter((reading) => reading.error !== null);
  if (failed.length === 0) return null;

  return (
    <Panel hand="c" red span={12} className="!py-[13px]">
      <p className="m-0 max-w-[70ch] text-body text-ink-2">
        <b className="font-semibold text-ink-1">
          {failed.length === 1
            ? `${failed[0]?.tool.label} could not read this site.`
            : `${failed.length} readings could not be run.`}
        </b>{' '}
        The verdict above is drawn from the rest.
      </p>
      <FailureList readings={failed} className="mt-3" />
    </Panel>
  );
}
