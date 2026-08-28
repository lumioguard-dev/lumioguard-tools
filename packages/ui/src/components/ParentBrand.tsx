import { parentHref } from '../integration/lumioguard.js';

/**
 * SERVED, not inlined: ten kilobytes of outlines a fork with the integration off
 * should carry none of. BASE_URL, because the app is also mounted under a path.
 */
const ASSET = (file: string): string => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${file}`;

/** Nothing when the integration is off, so the tool stands under its own name. */
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

export function ParentCredit(): JSX.Element | null {
  // The SAME switch the wordmark answers to. Reading PARENT_SITE directly took the
  // fallback from this row alone: a deployment setting only the app URL showed the
  // wordmark and no legal links.
  const site = parentHref();
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
