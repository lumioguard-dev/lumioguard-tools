import { AnalyticsProvider } from '@lumioguard/web-core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { consoleAnalytics } from './analytics/setup.js';
import '@lumioguard/ui/styles.css';

const container = document.getElementById('root');
if (container === null) throw new Error('#root is missing from index.html');

createRoot(container).render(
  <StrictMode>
    <AnalyticsProvider analytics={consoleAnalytics()}>
      <App />
    </AnalyticsProvider>
  </StrictMode>,
);
