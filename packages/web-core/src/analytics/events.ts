/**
 * Every event this console sends, named once. `cta_click` IS THE MARKETING
 * SITE'S OWN EVENT, its three property names kept exactly, so one insight covers
 * a click on either half. See `assets/consent.js` in the website repo.
 */
export const AnalyticsEvent = {
  CtaClick: 'cta_click',
  ScanSubmit: 'scan_submit',
  ToolsSelect: 'tools_select',
  ReportView: 'report_view',
} as const;

export type AnalyticsEvent = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

/** What travels with an event. Never an address, and never a site key. */
export type EventProperties = Readonly<Record<string, string | number | boolean | null>>;
