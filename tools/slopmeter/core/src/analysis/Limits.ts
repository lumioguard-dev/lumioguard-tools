/** Guards against Worker CPU limits on very large pages. */
export const AnalysisLimits = {
  maxHtmlBytes: 2_000_000,
  maxCssBytes: 600_000,
} as const;
