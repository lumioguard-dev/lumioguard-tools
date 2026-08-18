import { parseAddress } from '@lumioguard/shared';
import { type FormEvent, useState } from 'react';

interface ScanBarProps {
  readonly onScan: (url: string) => void;
  /** Somewhere to start for a visitor with no address in mind. */
  readonly examples: readonly string[];
}

/** No two drawn things sit at the same angle. */
const TILT = [-0.9, 0.7, -0.5] as const;

export function ScanBar({ onScan, examples }: ScanBarProps): JSX.Element {
  const [value, setValue] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const read = (address: string): void => {
    const parsed = parseAddress(address);
    if (!parsed.ok) {
      setProblem(parsed.problem);
      document.getElementById('scan-url')?.focus();
      return;
    }
    setProblem(null);
    onScan(parsed.value.address);
  };

  return (
    <form
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        read(value);
      }}
    >
      <label htmlFor="scan-url" className="sr-only">
        URL to read
      </label>

      <div className="relative mt-[26px]">
        <input
          id="scan-url"
          type="text"
          inputMode="url"
          // Not `url`: the browser's saved-address dropdown swallows Enter and
          // submits a highlighted suggestion, scanning a site from history.
          autoComplete="off"
          spellCheck={false}
          placeholder="paste any URL"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (problem !== null) setProblem(null);
          }}
          aria-invalid={problem !== null}
          aria-describedby={problem === null ? undefined : 'scan-url-problem'}
          className="w-full rounded-drawn-field border-2 border-pen-600 bg-paper-sunk py-[15px] pl-[17px] pr-[46px] text-16 text-ink-1 transition-colors placeholder:text-ink-3 focus:border-pen-400 focus:shadow-elev-ring focus:outline-none lg:py-[17px] lg:pl-5 lg:pr-[52px] lg:text-18"
        />

        {value !== '' && (
          <button
            type="button"
            onClick={() => {
              setValue('');
              setProblem(null);
              document.getElementById('scan-url')?.focus();
            }}
            aria-label="Clear the URL"
            className="absolute right-[10px] top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-transparent text-ink-3 transition-colors hover:border-pen-700 hover:bg-paper-high hover:text-ink-1 focus-visible:border-pen-400 lg:right-3"
          >
            <svg
              viewBox="0 0 16 16"
              className="h-[15px] w-[15px] fill-none stroke-current"
              aria-hidden="true"
              strokeWidth={1.7}
              strokeLinecap="round"
            >
              <path d="M3.6 3.2c3 2.9 6 5.9 9 8.9M12.4 3.4c-2.9 3-5.9 6-8.9 9" />
            </svg>
          </button>
        )}
      </div>

      <div
        role="group"
        aria-label="Or try one of these"
        className="mt-[9px] flex flex-wrap items-center gap-x-2 gap-y-[6px]"
      >
        <svg
          viewBox="0 0 26 25"
          className="-mt-[3px] mr-[2px] h-[24px] w-[25px] shrink-0 self-start fill-none stroke-pen-700"
          aria-hidden="true"
          strokeWidth={1.7}
          strokeLinecap="round"
        >
          <path d="M5 2.4c-.5 5.2.4 10.4-.2 14.6 5.8.7 11.6-.3 17.6.3" />
          <path d="M17.6 12.6c1.8 1.6 3.4 3.2 5 4.9M22.6 17.5c-1.7 1.5-3.4 3-5.2 4.3" />
        </svg>
        {examples.map((site, index) => (
          <button
            key={site}
            type="button"
            aria-label={`Read ${site}`}
            onClick={() => {
              setValue(site);
              read(site);
            }}
            style={{ transform: `rotate(${TILT[index] ?? 0}deg)` }}
            className="rounded-drawn-chip border-[1.4px] border-pen-700 bg-transparent px-[11px] py-[3px] font-sans text-14 font-medium leading-[1.35] text-ink-1 transition-colors hover:border-pen-600 hover:bg-paper-high hover:text-hand focus-visible:border-pen-400"
          >
            {site}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {/* Never disabled: a greyed-out primary refuses without saying why.
            Pressed empty, the parser answers under the field instead. */}
        <button
          type="submit"
          className="inline-flex items-center gap-[10px] rounded-drawn-chip border-2 border-pen-300 bg-pen-400 px-[22px] py-[13px] font-sans text-16 font-semibold text-paper-raised transition-colors hover:bg-pen-300 lg:px-7 lg:py-[15px] lg:text-17"
        >
          Read this site
          <svg
            viewBox="0 0 22 15"
            className="h-[15px] w-[22px] fill-none stroke-current"
            aria-hidden="true"
            strokeWidth={1.8}
            strokeLinecap="round"
          >
            <path d="M1 7.6c6-.6 12.6-.8 19.1-.4M15 2.4c1.9 1.8 3.7 3.6 5.5 5.4-1.8 1.9-3.6 3.7-5.6 5.4" />
          </svg>
        </button>
        {problem !== null && (
          <p id="scan-url-problem" role="alert" className="m-0 mt-[10px] text-caption text-red-400">
            {problem}
          </p>
        )}
      </div>
    </form>
  );
}
