import { Panel } from '@lumioguard/ui';
import type { Reading } from '../scan/useReadings.js';

/**
 * The readings that could not be run, named.
 *
 * Each tool answers its own origin, so one being refused says nothing about the
 * others: a site behind a bot challenge turned two away today while the third
 * read it fine. Without this the verdict would be drawn from whatever landed
 * and the reader would have no way to know it was partial, which is the same
 * failure as scoring a site nothing could read.
 *
 * A line, not a panel each. It is context for the verdict above rather than a
 * finding, and it disappears entirely when everything ran.
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
      <ul className="mt-3 flex list-none flex-col gap-1 p-0">
        {failed.map((reading) => (
          <li key={reading.tool.id} className="text-13 leading-[1.5] text-ink-3">
            <span className="font-semibold text-ink-2">{reading.tool.label}</span>: {reading.error}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
