import type { ReactNode } from 'react';

/**
 * What one tool contributes to a reading.
 *
 * The typed response never leaves the descriptor. `run` fetches it and closes
 * over it, handing back a score, a tier and a `render` that draws it; the
 * console holds a list of these and knows none of the three response shapes.
 * That is what lets one array hold tools whose wire types have nothing in
 * common, with no cast anywhere: the alternative, a `ToolDescriptor<T>` in a
 * heterogeneous list, cannot be expressed without erasing `T` and asserting it
 * back, and this repo treats such an assertion as a defect.
 */
export interface ToolOutcome {
  /** 0-100, higher is BETTER, on the same ladder every tool uses. */
  readonly score: number;
  /** This tool's own word for the band, not the consolidated one. */
  readonly tier: string;
  /** What that word means, in this tool's own sentence. */
  readonly tierDescription: string;
  /** The ink this tool paints that tier in, so its chip matches its own report. */
  readonly ink: string;
  /** The handle this reading was recorded under, or null when it was not. */
  readonly siteKey: string | null;
  /**
   * The tool's own panels.
   *
   * `verdict` is the score, tier and description, and the tool places it in its
   * OWN section heading. Handed in rather than drawn around the section,
   * because a strip above it said the tool's name a second time and read as a
   * separate object from the findings it was about.
   */
  readonly render: (verdict: ReactNode) => ReactNode;
  /**
   * The findings this reading charged for, worst first.
   *
   * `cost` is what the finding took off the score, which is the one thing every
   * tool's findings have in common: they are all points on the same 0-100
   * scale. That is what lets one panel rank a leak against a stock hero image
   * without inventing a severity vocabulary that spans them. It comes over the
   * wire from the same table the scorer uses, because `web` may not read `core`
   * and a second copy of the weights would drift.
   */
  readonly culprits: readonly {
    readonly id: string;
    readonly title: string;
    readonly note: string | null;
    readonly cost: number;
  }[];
  /**
   * Present only for a tool that CRAWLS. Data, not a rendering: the console
   * merges every crawl into ONE page list, because two tools reading one site
   * produced two doors to two tables of the same URLs.
   */
  readonly pages?: {
    readonly count: number;
    readonly maxDepth: number;
    readonly rows: readonly {
      readonly url: string;
      readonly depth: number;
      readonly score: number;
      readonly tier: string;
    }[];
  };
}

export interface ToolDescriptor {
  /** Stable, lower-case, and the segment its dev proxy is mounted at. */
  readonly id: string;
  /**
   * What this reading IS, never what built it.
   *
   * The engines are called Slopmeter, Leakpeek and Citecheck, and those names
   * appeared on the picker and again through the report. A visitor picking what
   * to read is choosing between concerns, not between products, and a finding
   * attributed to "Citecheck" asks them to learn a name before they can read
   * the line. The `id` keeps the engine's name, because it is a URL segment and
   * a stored `tool_id`; only what is shown changes.
   */
  readonly label: string;
  /** What this tool does, in ONE sentence. It is a tooltip, not a paragraph. */
  readonly summary: string;
  readonly run: (address: string, signal: AbortSignal) => Promise<ToolOutcome>;
}

/**
 * Every tool the console can run.
 *
 * Adding one is this list plus a file beside it. Nothing else in the console
 * names a tool: the picker, the consolidated score, the hand-off and the report
 * all read this array, so a fourth reading appears in all four places at once.
 */
export type ToolRegistry = readonly ToolDescriptor[];

/** Ids that are not in the registry are dropped rather than trusted. */
export function toolsById(registry: ToolRegistry, ids: readonly string[]): ToolDescriptor[] {
  return registry.filter((tool) => ids.includes(tool.id));
}
