import type { ReactNode } from 'react';

const SHELL =
  'inline-flex items-center gap-[9px] rounded-drawn-chip border-[1.6px] border-pen-700 bg-transparent px-4 py-[9px] font-sans text-15 font-medium text-ink-1 transition-colors hover:border-pen-600 hover:bg-paper-high';

/** Drawn once: two copies of a path cannot be kept level. */
function Arrow(): JSX.Element {
  return (
    <svg
      viewBox="0 0 20 12"
      className="h-[12px] w-[20px] fill-none stroke-current"
      aria-hidden="true"
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <path d="M19 6.1c-6-.5-12.1-.7-18-.4M6 1.2C4.2 2.9 2.5 4.6.9 6.3c1.7 1.7 3.4 3.4 5.2 5" />
    </svg>
  );
}

/**
 * A LINK where there is a URL and a button where the view is only a state: a
 * visitor may have arrived from a search result, so a page at its own address
 * gets an anchor rather than an onClick.
 */
export function BackLink({
  href,
  onClick,
  children,
}: {
  readonly href?: string;
  readonly onClick?: () => void;
  readonly children: ReactNode;
}): JSX.Element {
  if (href !== undefined) {
    return (
      <a href={href} className={SHELL}>
        <Arrow />
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={SHELL}>
      <Arrow />
      {children}
    </button>
  );
}
