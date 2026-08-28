import { useId } from 'react';

/**
 * Replaces `title`, which never responded to focus so a keyboard user never saw it.
 * CSS-only: a state hook per tool would re-render the whole picker on hover.
 */
export function Hint({
  text,
  children,
}: {
  readonly text: string;
  /** Given the id to hang `aria-describedby` on. */
  readonly children: (describedBy: string) => JSX.Element;
}): JSX.Element {
  const id = useId();

  return (
    <span className="group relative inline-flex">
      {children(id)}

      <span
        id={id}
        role="tooltip"
        // `invisible` rather than unmounted: `aria-describedby` resolves against the
        // document, and an element that is not there resolves to nothing.
        className="invisible absolute bottom-[calc(100%+9px)] left-1/2 z-20 w-max max-w-[30ch] -translate-x-1/2 rounded-drawn-chip border-2 border-pen-600 bg-paper-raised px-[13px] py-[9px] text-left text-13 leading-[1.45] text-ink-1 opacity-0 shadow-elev-popover transition-[opacity,visibility] duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 motion-reduce:transition-none"
      >
        {text}
      </span>
    </span>
  );
}
