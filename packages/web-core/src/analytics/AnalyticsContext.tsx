import { type ReactNode, createContext, useContext } from 'react';
import { Analytics } from './Analytics.js';

/** Off, so a component rendered outside a provider captures nothing. */
const AnalyticsContext = createContext<Analytics>(Analytics.off());

export function AnalyticsProvider({
  analytics,
  children,
}: {
  readonly analytics: Analytics;
  readonly children: ReactNode;
}): JSX.Element {
  return <AnalyticsContext.Provider value={analytics}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics(): Analytics {
  return useContext(AnalyticsContext);
}
