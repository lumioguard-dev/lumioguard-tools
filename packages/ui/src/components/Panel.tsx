import type { ReactNode } from 'react';

/** The page is a notebook: hand-drawn boxes, each holding one idea. */
export type Hand = 'a' | 'b' | 'c' | 'd';

export type PanelSpan = 4 | 5 | 6 | 7 | 8 | 12;

const HAND_CLASS: Record<Hand, string> = {
  a: '',
  b: 'pen-box--b',
  c: 'pen-box--c',
  d: 'pen-box--d',
};

const SPAN_CLASS: Record<PanelSpan, string> = {
  4: 'col-span-6 md:col-span-3 lg:col-span-4',
  5: 'col-span-6 md:col-span-3 lg:col-span-5',
  6: 'col-span-6 md:col-span-3 lg:col-span-6',
  7: 'col-span-6 md:col-span-3 lg:col-span-7',
  8: 'col-span-6 md:col-span-3 lg:col-span-8',
  12: 'col-span-6 lg:col-span-12',
};

export interface PanelProps {
  readonly hand?: Hand;
  /** Provenance: quarantined by its frame, not by a disclaimer. */
  readonly dashed?: boolean;
  /** The reading, ringed in the second pen. */
  readonly red?: boolean;
  readonly hatched?: boolean;
  readonly span?: PanelSpan;
  readonly className?: string;
  readonly children: ReactNode;
}

export function Panel({
  hand = 'a',
  dashed = false,
  red = false,
  hatched = false,
  span = 12,
  className = '',
  children,
}: PanelProps): JSX.Element {
  const modifiers = [
    HAND_CLASS[hand],
    dashed ? 'pen-box--dashed' : '',
    red ? 'pen-box--red' : '',
    hatched ? 'bg-rule-hatch' : '',
    SPAN_CLASS[span],
    className,
  ]
    .filter((value) => value !== '')
    .join(' ');

  return <section className={`pen-box flex flex-col ${modifiers}`}>{children}</section>;
}

/**
 * Matches the space ABOVE the ask. The grid's own `gap-10` adds 40px, so this
 * carries the rest of that 128px: change one and change the other.
 */
export const GAP_BELOW_ASK = 'mt-[88px]';

export interface PanelGridProps {
  /** Fill the height left under the masthead, so the colophon sits at the foot. */
  readonly fills?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

export function PanelGrid({
  fills = false,
  className = '',
  children,
}: PanelGridProps): JSX.Element {
  return (
    <div
      className={`mx-auto grid w-full max-w-[76rem] grid-cols-6 gap-10 px-4 pt-24 lg:grid-cols-12 lg:px-[26px] lg:pt-[128px] ${
        fills ? 'flex-1 content-start pb-10' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export interface PanelHeadProps {
  readonly title: string;
  readonly kicker?: string;
  readonly mark?: ReactNode;
  readonly trailing?: ReactNode;
}

export function PanelHead({ title, kicker, mark, trailing }: PanelHeadProps): JSX.Element {
  return (
    <div className="flex items-start gap-3">
      {mark !== undefined && <span className="mt-[2px] shrink-0">{mark}</span>}
      <div className="min-w-0 flex-1">
        <p className="pen-title">{title}</p>
        {kicker !== undefined && <p className="pen-kicker">{kicker}</p>}
      </div>
      {trailing}
    </div>
  );
}
