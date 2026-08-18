/** The figure's metrics, in one place. */
export const FIGURE_TYPE =
  'text-48 font-extrabold leading-tight tracking-tight tabular-nums lg:text-60';

/** The figure's place on the page, before there is a figure. */
export function PendingScore(): JSX.Element {
  return (
    <span className={`relative inline-block ${FIGURE_TYPE}`}>
      <span className="invisible" aria-hidden="true">
        00
      </span>
      <span className="sr-only">Not read yet</span>
      <svg
        viewBox="0 0 100 8"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-[0.17em] h-[0.1em] w-full fill-none stroke-pen-600"
        aria-hidden="true"
        strokeWidth={2.2}
        strokeLinecap="round"
      >
        <path vectorEffect="non-scaling-stroke" d="M2 5.1C26 3.2 53 6.4 98 4.3" />
      </svg>
    </span>
  );
}
