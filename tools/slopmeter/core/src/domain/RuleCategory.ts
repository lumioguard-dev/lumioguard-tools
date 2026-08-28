/** Named for what a tell is evidence OF, which is how the axes read them. */
export const RuleCategory = {
  Unfinished: 'unfinished',
  Voice: 'voice',
  Composition: 'composition',
  Stock: 'stock',
  Finish: 'finish',
  Quality: 'quality',
  Document: 'document',
  Maker: 'maker',
  Platform: 'platform',
  Handwork: 'handwork',
} as const;

export type RuleCategoryValue = (typeof RuleCategory)[keyof typeof RuleCategory];

/**
 * Where the page was hosted, which is a deployment choice rather than a
 * property of what was shipped. A builder's own fingerprint is NOT here: an
 * untouched template is what it is, whoever assembled it.
 */
export const PROVENANCE_CATEGORIES: ReadonlySet<RuleCategoryValue> = new Set([
  RuleCategory.Platform,
]);
