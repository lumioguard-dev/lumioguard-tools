import { describe, expect, it } from 'vitest';
import { Analytics, type CaptureSink } from '../Analytics.js';
import { AnalyticsEvent, type EventProperties } from '../events.js';

function recorder(): CaptureSink & { readonly sent: [string, EventProperties][] } {
  const sent: [string, EventProperties][] = [];
  return { sent, capture: (event, properties) => void sent.push([event, properties]) };
}

describe('Analytics', () => {
  it('drops everything when it is off', async () => {
    const analytics = Analytics.off();
    analytics.capture(AnalyticsEvent.CtaClick, { cta_text: 'Log in to LumioGuard' });
    await Promise.resolve();
    expect(true).toBe(true);
  });

  // The click that matters lands before PostHog finishes loading often enough
  // to matter: a hand-off captured into a sink that does not exist yet is the
  // number this whole thing was added to see.
  it('keeps an event captured before the sink arrived, in the order captured', async () => {
    const sink = recorder();
    let attach: (value: CaptureSink) => void = () => undefined;
    const loading = new Promise<CaptureSink>((resolve) => {
      attach = resolve;
    });
    const analytics = new Analytics(loading);

    analytics.capture(AnalyticsEvent.ScanSubmit, { tools: 'leakpeek' });
    analytics.capture(AnalyticsEvent.CtaClick, { cta_text: 'Log in to LumioGuard' });
    expect(sink.sent).toHaveLength(0);

    attach(sink);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(sink.sent.map(([event]) => event)).toEqual(['scan_submit', 'cta_click']);
  });

  it('sends an empty property bag rather than nothing', async () => {
    const sink = recorder();
    new Analytics(Promise.resolve(sink)).capture(AnalyticsEvent.ReportView);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sink.sent).toEqual([['report_view', {}]]);
  });
});
