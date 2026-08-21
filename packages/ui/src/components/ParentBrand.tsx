import { parentHref } from '../integration/lumioguard.js';

// Underlined at rest, not only on hover. It is the one link in the masthead and
// the colophon, and a link nothing marks as one is a link nobody clicks.
const LINK =
  'border-b border-pen-700/60 no-underline transition-colors hover:border-pen-300 hover:text-hand';

/**
 * The parent wordmark beside the tool's own, or nothing when the integration is
 * off: in which case the tool stands under its own name alone.
 */
export function ParentWordmark({ className }: { readonly className?: string }): JSX.Element | null {
  const href = parentHref();
  if (href === null) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={className === undefined ? LINK : `${LINK} ${className}`}
    >
      LumioGuard
    </a>
  );
}

/** The colophon's attribution line, or nothing. */
export function ParentCredit(): JSX.Element | null {
  // The same switch the wordmark answers to, read the same way. Two conditions
  // for one integration is how a fork ends up with the word "by" and no name.
  if (parentHref() === null) return null;

  return (
    <span className="mt-[1px] block text-17 leading-[1.2] text-ink-2">
      by <ParentWordmark />
    </span>
  );
}
