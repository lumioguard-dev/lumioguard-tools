import { useId } from 'react';

/**
 * A drawn tooltip, replacing the browser's own.
 *
 * `title` was doing this job and doing it badly: the browser decides when it
 * appears (about a second), where, and what it looks like, which is a grey OS
 * rectangle on a page drawn in ballpoint. None of that is themeable and none of
 * it responds to focus, so a keyboard user never saw the text at all.
 *
 * CSS-only. There is no open state to hold, which matters because the picker
 * draws one of these per tool and a state hook each would re-render the whole
 * set on every hover. `group-hover` and `group-focus-within` cover pointer and
 * keyboard alike, and `aria-describedby` is what actually carries the text to a
 * screen reader, so the visual layer can stay `aria-hidden`.
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
        // `invisible` rather than unmounted: a screen reader resolves
        // `aria-describedby` against the document, and an element that is not
        // there resolves to nothing.
        className="invisible absolute bottom-[calc(100%+9px)] left-1/2 z-20 w-max max-w-[30ch] -translate-x-1/2 rounded-drawn-chip border-2 border-pen-600 bg-paper-raised px-[13px] py-[9px] text-left text-13 leading-[1.45] text-ink-1 opacity-0 shadow-elev-popover transition-[opacity,visibility] duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 motion-reduce:transition-none"
      >
        {text}
      </span>
    </span>
  );
}
