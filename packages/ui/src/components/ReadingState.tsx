import { useEffect, useState } from 'react';

/**
 * Narration, NOT progress: the API does not say how far along a read is. The last
 * line holds rather than the sequence looping, which would keep promising work
 * already done.
 */
const PASSES: readonly string[] = [
  'Fetching the front page',
  'Following the links',
  'Reading each page in turn',
  'Pulling in the stylesheets',
  'Running the rules',
  'Rolling the pages up',
];

const DWELL_MS = 1500;

export function ReadingState(): JSX.Element {
  const passes = PASSES;
  const [index, setIndex] = useState(0);
  const [still, setStill] = useState(false);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStill(true);
      return;
    }
    setIndex(0);
    const tick = window.setInterval(() => {
      setIndex((current) => (current < passes.length - 1 ? current + 1 : current));
    }, DWELL_MS);
    return () => clearInterval(tick);
  }, [passes.length]);

  const line = still ? 'Reading the site' : passes[index];

  return (
    <div className="mt-8 flex flex-col items-center" aria-live="polite" aria-atomic="true">
      <p className="relative m-0 text-center font-hand text-20 leading-none text-hand lg:text-24">
        {/* Keyed on the pass, so each line is laid down fresh rather than cross-fading
            into the last. Ink does not dissolve. */}
        <span key={line} className={still ? '' : 'writing inline-block'}>
          {line}
        </span>
        <span className="nib ml-[3px] inline-block h-[0.95em] w-[2px] translate-y-[2px] rounded-[1px] bg-hand align-baseline" />
      </p>

      {/* Ruled, not a progress track: it does not fill, because there is nothing
          honest to fill it with. */}
      <svg
        viewBox="0 0 260 6"
        preserveAspectRatio="none"
        className="mt-[13px] h-[6px] w-[min(19rem,100%)] fill-none stroke-pen-700"
        aria-hidden="true"
        strokeLinecap="round"
        strokeWidth={1.4}
      >
        <path vectorEffect="non-scaling-stroke" d="M2 3.4C46 2.2 90 4.1 134 3c40-1 80 1.4 124 .6" />
      </svg>
    </div>
  );
}
