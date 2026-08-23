/**
 * The drawn marks, in the same ballpoint hand as the page: authored paths,
 * never glyphs from a font with its own opinion about weight. Each is drawn at
 * 32 units and set smaller with a non-scaling stroke, so the weight is the page's.
 */

const PEN = {
  fill: 'none',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const NS = 'non-scaling-stroke';
const SIZE = 'h-[30px] w-[30px] shrink-0 stroke-pen-600';

/** The same page again: one sheet behind another, drawn identically. */
export function MarkTemplate(): JSX.Element {
  return (
    <svg viewBox="0 0 32 32" className={SIZE} aria-hidden="true" {...PEN}>
      <path
        vectorEffect={NS}
        className="stroke-pen-700"
        d="M12.4 5.6c5-.5 10.2.4 15.2-.2 1 0 1.4.6 1.3 1.6-.3 4.2-.2 8.4.1 12.6"
      />
      <path
        vectorEffect={NS}
        d="M4 11.6c5.2-.5 10.6.4 15.8-.2 1 0 1.4.6 1.3 1.6-.3 4.6.2 9.2-.1 13.8-.1.9-.6 1.3-1.4 1.3-5.2-.3-10.6.4-15.8 0-.7 0-1-.5-.9-1.3.2-4.7-.1-9.4.1-14.1 0-.7.3-1 1-1.1Z"
      />
      <g className="stroke-pen-700" strokeWidth={1.4}>
        <path vectorEffect={NS} d="M6.6 17.4c3.4-.3 7 .2 10.4-.1" />
        <path vectorEffect={NS} d="M6.6 21.4c2.6-.2 5.4.2 8-.1" />
      </g>
    </svg>
  );
}

/** A lock that never closed: the shackle is standing open. */
export function MarkExposed(): JSX.Element {
  return (
    <svg viewBox="0 0 32 32" className={SIZE} aria-hidden="true" {...PEN}>
      <path
        vectorEffect={NS}
        d="M6.6 15.4c6-.6 12.2.5 18.2-.1 1 0 1.4.6 1.3 1.6-.3 3.2-.2 6.4 0 9.6.1 1-.4 1.4-1.3 1.5-6 .5-12.2.5-18.2 0-.7 0-1-.5-1-1.3.2-3.4-.1-6.8.1-10.2 0-.7.3-1 .9-1.1Z"
      />
      {/* Open, and leaning away: a closed shackle would say the opposite. */}
      <path
        vectorEffect={NS}
        stroke="var(--red-400)"
        d="M10.4 15.2c-.4-2.6-.6-5.4 1.4-7.4 2.2-2.2 6-1.8 7.6.8.6 1 .8 2.1.7 3.2"
      />
      <path
        vectorEffect={NS}
        className="stroke-pen-700"
        strokeWidth={1.5}
        d="M16 19.6c.3 1.6.2 3.2-.1 4.8"
      />
    </svg>
  );
}

/** A lens held over lines of text: what a crawler manages to make out. */
export function MarkLegible(): JSX.Element {
  return (
    <svg viewBox="0 0 32 32" className={SIZE} aria-hidden="true" {...PEN}>
      <g className="stroke-pen-700" strokeWidth={1.4}>
        <path vectorEffect={NS} d="M4.4 8.4c6.4-.5 13 .4 19.4-.2" />
        <path vectorEffect={NS} d="M4.4 13.4c4-.3 8.2.3 12.2-.1" />
        <path vectorEffect={NS} d="M4.4 24.4c3-.2 6.2.2 9.2-.1" />
      </g>
      <path vectorEffect={NS} d="M19.4 14.6a5.6 5.6 0 1 1-.2-.2" />
      <path
        vectorEffect={NS}
        stroke="var(--red-400)"
        strokeWidth={2}
        d="M23.4 24.2c1.4 1.5 2.8 3 4.2 4.4"
      />
    </svg>
  );
}
