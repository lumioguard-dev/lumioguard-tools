import { PARENT_SITE, parentHref } from '../integration/lumioguard.js';

/**
 * The parent's artwork, served rather than inlined: it is ten kilobytes of
 * outlines and a fork with the integration off should carry none of it.
 * BASE_URL, because the app is also mounted under a path.
 */
const ASSET = (file: string): string => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${file}`;

/**
 * The parent wordmark, or nothing when the integration is off: in which case
 * the tool stands under its own name alone. Drawn at 528 by 103 and set here at
 * the height the masthead wants.
 */
export function ParentWordmark({ className }: { readonly className?: string }): JSX.Element | null {
  const href = parentHref();
  if (href === null) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={`inline-flex items-center opacity-90 transition-opacity hover:opacity-100 ${className ?? ''}`}
    >
      <img src={ASSET('lumioguard-logo.svg')} alt="LumioGuard" width={128} height={25} />
    </a>
  );
}

/** The colophon's legal row, or nothing when there is no parent site to point at. */
export function ParentCredit(): JSX.Element | null {
  // The same switch the wordmark answers to, read the same way. Two conditions
  // for one integration is how a fork ends up with the word "by" and no name.
  const site = parentHref() === null ? null : PARENT_SITE;
  if (site === null) return null;

  const LINK = 'transition-colors hover:text-hand';

  return (
    <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-13 leading-[1.5] text-ink-3">
      <a className={LINK} href={`${site}/terms`} target="_blank" rel="noreferrer noopener">
        Terms &amp; Conditions
      </a>
      <a className={LINK} href={`${site}/privacy`} target="_blank" rel="noreferrer noopener">
        Privacy
      </a>
    </nav>
  );
}
