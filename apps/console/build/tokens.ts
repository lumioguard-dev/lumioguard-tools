/**
 * Read before the token stylesheet loads, so the fallback must be a real colour.
 * The hex COPIES the light palette rather than importing it, because plain Node
 * loads this module; `__tests__/tokens.test.ts` keeps the copy honest.
 */
export const CSS_INK_1 = 'var(--ink-1,#151b28)';
export const CSS_INK_2 = 'var(--ink-2,#414b63)';
export const CSS_INK_3 = 'var(--ink-3,#545f78)';
export const CSS_HAND = 'var(--hand,#2f4fb5)';
export const CSS_PAPER_BASE = 'var(--paper-base,#f5f2e8)';
export const CSS_LINE_BASE = 'var(--line-base,#dbe2f2)';
