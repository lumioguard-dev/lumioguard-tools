import { AnalyticsEvent, type EventProperties, useAnalytics } from '@lumioguard/web-core';
import { useEffect, useRef } from 'react';

/**
 * Reported ONCE, latched rather than fired from a dependency edge: each reading
 * re-runs the effect, and a slow third tool would double the denominator every
 * hand-off rate is measured against. The properties are read from a ref for that.
 */
export function useReportView(settled: boolean, properties: EventProperties): void {
  const analytics = useAnalytics();
  const latest = useRef(properties);
  latest.current = properties;
  const reported = useRef(false);

  useEffect(() => {
    if (!settled || reported.current) return;
    reported.current = true;
    analytics.capture(AnalyticsEvent.ReportView, latest.current);
  }, [analytics, settled]);
}
