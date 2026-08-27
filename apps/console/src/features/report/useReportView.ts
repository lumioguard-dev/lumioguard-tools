import { AnalyticsEvent, type EventProperties, useAnalytics } from '@lumioguard/web-core';
import { useEffect, useRef } from 'react';

/**
 * A finished report, reported ONCE.
 *
 * Latched rather than fired from a dependency edge: each reading lands on its
 * own and re-runs the effect, and without the latch a slow third tool would
 * report the same page again and double the denominator every hand-off rate is
 * measured against.
 *
 * The properties are read from a ref rather than depended on, so rebuilding
 * that object on a render cannot re-arm an effect whose only trigger is the
 * moment the readings settled.
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
