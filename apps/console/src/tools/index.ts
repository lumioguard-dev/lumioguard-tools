import { citecheck } from './citecheck/index.js';
import { leakpeek } from './leakpeek/index.js';
import type { ToolRegistry } from './registry.js';
import { slopmeter } from './slopmeter/index.js';

/**
 * Every reading the console can run, in the order they are offered.
 *
 * Slopmeter first because it is the one a visitor arrives wanting; the other
 * two answer questions most people have not thought to ask yet. A fourth tool
 * is a file beside these and a line in this array, and it appears in the
 * picker, the consolidated score and the hand-off without another edit.
 */
export const TOOLS: ToolRegistry = [slopmeter, leakpeek, citecheck];

/** Everything, which is what a visitor who has chosen nothing gets. */
export const DEFAULT_TOOL_IDS: readonly string[] = TOOLS.map((tool) => tool.id);
