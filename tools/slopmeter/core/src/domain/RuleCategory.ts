export const RuleCategory = {
  Leftover: 'leftover',
  Copy: 'copy',
  Layout: 'layout',
  Default: 'default',
  Craft: 'craft',
  Quality: 'quality',
  Structure: 'structure',
  Fingerprint: 'fingerprint',
  Stack: 'stack',
  Human: 'human',
} as const;

export type RuleCategoryValue = (typeof RuleCategory)[keyof typeof RuleCategory];

/** Describes the tool, not the page, so it may never reach the score. */
export const PROVENANCE_CATEGORIES: ReadonlySet<RuleCategoryValue> = new Set([
  RuleCategory.Fingerprint,
  RuleCategory.Stack,
]);
