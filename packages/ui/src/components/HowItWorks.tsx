/** The three beats of a reading, drawn. */
interface Step {
  readonly label: string;
  readonly art: JSX.Element;
}

/** Every stroke on this page is a curve with round ends; these are no exception. */
const PEN = {
  fill: 'none',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/**
 * The line weight is the page's, not the icon's. These are drawn at 52 units
 * and set at 60 or 76, so without this every stroke would come out heavier than
 * the panel it sits in, and heavier on a wide screen than on a narrow one.
 */
const NS = 'non-scaling-stroke';

/** The field, with something typed in it and the caret still sitting there. */
function ArtAddress(): JSX.Element {
  return (
    <svg
      viewBox="0 0 52 32"
      className="h-[37px] w-[60px] stroke-pen-600 lg:h-[47px] lg:w-[76px]"
      aria-hidden="true"
      {...PEN}
    >
      <path
        vectorEffect={NS}
        d="M3 5.6C17 4.4 31 6.2 45.8 5c1.7-.1 2.5 1 2.3 3.1-.5 5.4.3 10.8-.2 16.2-.1 1.7-1 2.5-2.6 2.5-14 .6-28.2-1-42-.2-1.5.1-2.1-.8-2-2.7.4-5.6-.3-11.2.1-16.8.1-1.5.6-2 1.6-2.1Z"
      />
      <g className="stroke-pen-700">
        <path vectorEffect={NS} d="M9 16.4c5.4-.5 11 .4 16.4-.2" />
        <path vectorEffect={NS} d="M29.6 10.4c.4 4-.3 8 .3 12" />
      </g>
    </svg>
  );
}

/** More than one sheet, and a charge found on the one in front. */
function ArtRead(): JSX.Element {
  return (
    <svg
      viewBox="0 0 52 44"
      className="h-[51px] w-[60px] stroke-pen-600 lg:h-[64px] lg:w-[76px]"
      aria-hidden="true"
      {...PEN}
    >
      {/* the sheet behind, showing only where the front one does not cover it */}
      <path
        vectorEffect={NS}
        className="stroke-pen-700"
        d="M14 5.4c8.6-.7 17.4.6 26-.2 1.5-.1 2.2.8 2 2.4-.5 6.6-.2 13.2.2 19.8"
      />
      <path
        vectorEffect={NS}
        d="M7 13.6C15.6 12.8 24.4 14.2 33 13.4c1.5-.1 2.2.8 2 2.4-.5 7.6.2 15.2-.2 22.8-.1 1.4-.9 2-2.1 2-8.6-.4-17.4.6-26 0-1.1-.1-1.5-.8-1.4-2 .3-7.8-.2-15.6.1-23.4.1-1.1.5-1.5 1.6-1.6Z"
      />
      <g className="stroke-pen-700">
        <path vectorEffect={NS} d="M12 21.4c5.6-.5 11.4.4 17-.2" />
        <path vectorEffect={NS} d="M12 27.4c4.4-.4 9 .3 13.4-.2" />
      </g>
      <path
        vectorEffect={NS}
        stroke="var(--red-400)"
        strokeWidth={2}
        d="M20 30.5c2.4 2.6 4.8 5.2 7.2 7.8M28 30c-2.8 2.7-5.6 5.4-8.4 8.1"
      />
    </svg>
  );
}

/** The band the verdict is read off, with the marker standing on it. */
function ArtScore(): JSX.Element {
  return (
    <svg
      viewBox="0 0 52 30"
      className="h-[35px] w-[60px] stroke-pen-600 lg:h-[44px] lg:w-[76px]"
      aria-hidden="true"
      {...PEN}
    >
      <path vectorEffect={NS} d="M2 23.4c8-.8 16.4.6 24.6-.2 8-.8 16.4.6 23.4-.2" />
      <g className="stroke-pen-700" strokeWidth={1.4}>
        <path vectorEffect={NS} d="M13 18.4c.3 1.8.2 3.6-.1 5.2" />
        <path vectorEffect={NS} d="M26 18.6c.3 1.8.2 3.6-.1 5.2" />
        <path vectorEffect={NS} d="M39 18.4c.3 1.8.2 3.6-.1 5.2" />
      </g>
      {/* the marker, the one accent in the set: the reading is the payoff */}
      <path
        fill="var(--red-400)"
        stroke="none"
        d="M30.6 7c2.4-.3 4.8-.5 7.2-.2-1.1 2.4-2.3 4.7-3.6 7-1.2-2.3-2.4-4.6-3.6-6.8Z"
      />
      <path
        vectorEffect={NS}
        stroke="var(--red-400)"
        strokeWidth={2}
        d="M34.2 13.6c.4 3.4-.3 6.8.3 10.2"
      />
    </svg>
  );
}

/** The art is shared; the words are each tool's own. */
export interface HowItWorksLabels {
  readonly paste: string;
  readonly read: string;
  readonly result: string;
}

/** Two dashes of a pen lifting between beats. */
function Trail(): JSX.Element {
  return (
    <svg
      viewBox="0 0 12 28"
      className="h-[26px] w-[14px] stroke-pen-700 lg:h-[32px]"
      aria-hidden="true"
      {...PEN}
      strokeWidth={1.5}
    >
      <path vectorEffect={NS} d="M6 1.4c.4 3.2-.3 6.4.3 9.6M6.4 16.8c.4 3.4-.3 6.8.3 10.2" />
    </svg>
  );
}

export function HowItWorks({ labels }: { readonly labels: HowItWorksLabels }): JSX.Element {
  const STEPS: readonly Step[] = [
    { label: labels.paste, art: <ArtAddress /> },
    { label: labels.read, art: <ArtRead /> },
    { label: labels.result, art: <ArtScore /> },
  ];

  return (
    <ol className="m-0 w-full list-none p-0">
      {STEPS.map((step, index) => (
        <li
          key={step.label}
          className="grid grid-cols-[60px_minmax(0,1fr)] items-center gap-x-4 lg:grid-cols-[76px_minmax(0,1fr)] lg:gap-x-[22px]"
        >
          <span className="flex justify-center">{step.art}</span>
          <span className="font-hand text-18 leading-[1.25] text-ink-1 lg:text-20">
            {step.label}
          </span>
          {index < STEPS.length - 1 && (
            <span className="col-start-1 flex justify-center py-[5px] lg:py-2">
              <Trail />
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
