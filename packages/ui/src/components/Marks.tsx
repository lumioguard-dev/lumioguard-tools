/**
 * Axis marks and the reel, drawn rather than borrowed.
 *
 * Every path here is an irregular curve with round joins: a geometric icon set
 * would sit on this surface as the one machine-made thing on a page of drawn
 * boxes. Each axis carries its own mark so the four never blur together, which
 * is the whole point of keeping them apart.
 */
type MarkProps = { readonly className?: string };

const STROKE = {
  fill: 'none',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function Frame({
  children,
  className = 'h-6 w-[30px] stroke-pen-600',
}: {
  readonly children: JSX.Element;
  readonly className?: string;
}): JSX.Element {
  return (
    <svg viewBox="0 0 30 24" className={className} aria-hidden="true" {...STROKE}>
      {children}
    </svg>
  );
}

/** Scored: the only axis allowed to move the number. */
export function MarkScored({ className }: MarkProps): JSX.Element {
  return (
    <Frame {...(className === undefined ? {} : { className })}>
      <g>
        <path d="M3 6.5c7-.8 15-.9 23-.2M3 12.4c5-.5 10-.6 15-.3M3 18.2c3-.4 6-.4 9-.2" />
        <path d="M19 17.6c1.4 1.5 2.8 3 4.2 4.5 1.6-2.4 3.2-4.8 5-7" />
      </g>
    </Frame>
  );
}

/**
 * The picker's box, ticked or empty.
 *
 * A drawn box rather than the browser's checkbox, which is the one machine-made
 * control on a page of drawn frames. The real `<input>` is still there and still
 * does the work; this is what is seen. Both states draw the box, so the chips
 * hold their width and the tick is the only thing that moves.
 */
export function MarkTick({ on }: { readonly on: boolean }): JSX.Element {
  return (
    <svg
      viewBox="0 0 20 20"
      // NO opacity modifier on the stroke. `stroke-pen-700/60` computed to
      // `stroke: none` and the empty box vanished: these tokens are `var()`
      // strings, and an alpha applied to one paints nothing at all rather than
      // failing. The faint state is a lighter pen, not a faded one.
      className={`h-[15px] w-[15px] shrink-0 ${on ? 'stroke-pen-300' : 'stroke-pen-700'}`}
      aria-hidden="true"
      {...STROKE}
    >
      <path d="M3.4 4.2c4.4-.7 9-.8 13.3-.2.5.1.8.5.8 1 .2 3.4.2 6.9 0 10.3 0 .6-.3.9-.9 1-4.3.6-8.8.5-13.2-.1-.5-.1-.8-.4-.8-1-.2-3.4-.2-6.8 0-10.1 0-.5.3-.8.8-.9Z" />
      {on && (
        <path
          d="M5.4 10.3c1.5 1.5 2.9 3 4.3 4.6 1.9-3.6 4.2-7 6.9-10.1"
          strokeWidth={2.1}
          className="stroke-pen-300"
        />
      )}
    </svg>
  );
}

/** The reel, for the rail. */
export function MarkReel(): JSX.Element {
  return (
    <svg
      viewBox="0 0 30 22"
      className="h-[22px] w-[30px] stroke-red-400"
      aria-hidden="true"
      {...STROKE}
    >
      <path d="M2 3.4c8-1 18-1.2 26 .2 1 .1 1.4 1 1.3 2-.3 3.6-.4 8.2-.2 12.6.1 1.3-.4 2-1.6 2.1-8 .9-17 .9-25 .1-1.1-.1-1.7-.7-1.7-1.9C1 14 .9 9 1.2 4.6 1.3 3.8 1.5 3.5 2 3.4Z" />
      <path d="M9.6 11.4a2.6 2.6 0 1 1-.1-.2M21.4 11.3a2.6 2.6 0 1 1-.1-.2" strokeWidth={1.5} />
      <path d="M11.8 11.6c2-.3 4.2-.3 6.3 0" strokeWidth={1.5} />
    </svg>
  );
}

/**
 * The rule under the rail: one pen stroke, ruled.
 *
 * It used to bow: three shallow curves across the width, so the stroke was
 * never quite level. Straight by decision; the frames it sits above keep their
 * hands, and this one line does not.
 */
export function DrawnRule(): JSX.Element {
  return (
    <svg
      viewBox="0 0 1000 7"
      preserveAspectRatio="none"
      className="block h-[7px] w-full stroke-pen-600"
      aria-hidden="true"
      fill="none"
      strokeWidth={1.7}
    >
      <path d="M2 4h996" />
    </svg>
  );
}
