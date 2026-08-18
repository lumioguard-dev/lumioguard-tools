import { AUDIT_ORIGIN } from '../integration/lumioguard.js';

const LINK =
  'border-b border-transparent no-underline transition-colors hover:border-pen-700 hover:text-hand';

/**
 * The parent wordmark beside the tool's own, or nothing when the integration is
 * off — in which case the tool stands under its own name alone.
 */
export function ParentWordmark({ className }: { readonly className?: string }): JSX.Element | null {
  if (AUDIT_ORIGIN === null) return null;

  return (
    <a
      href={AUDIT_ORIGIN}
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
  if (AUDIT_ORIGIN === null) return null;

  return (
    <span className="mt-[1px] block text-17 leading-[1.2] text-ink-2">
      by <ParentWordmark />
    </span>
  );
}
