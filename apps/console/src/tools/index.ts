import { citecheck } from './citecheck/index.js';
import { leakpeek } from './leakpeek/index.js';
import type { ToolRegistry } from './registry.js';
import { slopmeter } from './slopmeter/index.js';

/**
 * In the ORDER they are offered, Slopmeter first because it is the one a visitor
 * arrives wanting. A fourth tool is a file beside these and a line here, and it
 * appears in the picker, the consolidated score and the hand-off at once.
 */
export const TOOLS: ToolRegistry = [slopmeter, leakpeek, citecheck];

/** What a visitor who has chosen nothing gets. */
export const DEFAULT_TOOL_IDS: readonly string[] = TOOLS.map((tool) => tool.id);
