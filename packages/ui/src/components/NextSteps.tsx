import {
  AnalyticsEvent,
  type EventProperties,
  useAnalytics,
  withoutQuery,
} from '@lumioguard/web-core';
import { fullAuditUrl } from '../integration/lumioguard.js';

/**
 * The label in two halves: the brand is SET lowercase rather than typed that
 * way, and the click reports the words on the button, so a label that drifted
 * from what was captured would be a number about a button nobody can find.
 */
const LABEL_VERB = 'Log in to';
const LABEL_BRAND = 'LumioGuard';

/** The hand-off, offer and button together. Renders nothing when it is off. */
export function NextSteps({
  siteKey,
  offer,
  context,
}: {
  readonly siteKey: string | null | readonly (string | null)[];
  /** What the hand-off is worth, in this tool's own words. */
  readonly offer: string;
  /** What the page around it knows, sent with the click. Never an address. */
  readonly context?: EventProperties;
}): JSX.Element | null {
  const analytics = useAnalytics();
  const href = fullAuditUrl(siteKey);
  if (href === null) return null;

  return (
    <div className="mt-7 flex flex-col gap-y-5 sm:flex-row sm:items-center sm:gap-x-10">
      {/* The offer outranks the button: as a grey line under the largest object
          in the panel, a scanning eye took the chip and never learned what for. */}
      <div className="min-w-0 flex-1">
        <p className="m-0 max-w-[34ch] font-sans text-18 font-semibold leading-[1.35] text-ink-1 lg:text-20">
          {offer}
        </p>
      </div>

      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        onClick={() =>
          analytics.capture(AnalyticsEvent.CtaClick, {
            cta_text: `${LABEL_VERB} ${LABEL_BRAND}`,
            cta_href: withoutQuery(href),
            ...context,
          })
        }
        className="inline-flex shrink-0 items-center gap-[10px] self-start rounded-drawn-chip border-2 border-pen-300 bg-pen-400 px-5 py-[13px] font-sans text-16 font-semibold text-paper-raised no-underline transition-colors hover:bg-pen-300 sm:self-auto sm:px-6 lg:px-7 lg:py-[15px] lg:text-17"
      >
        {/* Set lowercase rather than typed lowercase, as the masthead does: the
            document keeps the real name, so a copy or a bookmark still spells
            it properly. */}
        {LABEL_VERB} <span className="lowercase">{LABEL_BRAND}</span>
        <svg
          viewBox="0 0 22 15"
          className="h-[15px] w-[22px] fill-none stroke-current"
          aria-hidden="true"
          strokeWidth={1.8}
          strokeLinecap="round"
        >
          <path d="M1 7.6c6-.6 12.6-.8 19.1-.4M15 2.4c1.9 1.8 3.7 3.6 5.5 5.4-1.8 1.9-3.6 3.7-5.6 5.4" />
        </svg>
      </a>
    </div>
  );
}
