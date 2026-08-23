import type { ReactNode } from 'react';
import type { ToolCopy } from './catalogue.js';

/**
 * What one tool contributes to a reading. `run` closes over the typed response
 * and hands back a `render`, which is what lets one array hold tools whose wire
 * shapes have nothing in common with no cast anywhere.
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
   * The tool's own panels. `verdict` is handed in rather than drawn around the
   * section, because a strip above it said the tool's name twice and read as a
   * separate object from the findings it was about.
   */
  readonly render: (verdict: ReactNode) => ReactNode;
  /**
   * The findings this reading charged for, worst first. `cost` is points off
   * the same 0-100 scale every tool uses, so one panel can rank a leak against
   * a stock hero image. It rides the wire because `web` may not read `core`.
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

/**
 * One reading, ready to run: its words from the catalogue and the two things a
 * `.ts` module cannot hold. Extending `ToolCopy` rather than restating it keeps
 * a label from meaning one thing on the chooser and another in the report.
 */
export interface ToolDescriptor extends ToolCopy {
  /** The drawn mark it is offered under, so a fourth reading needs one to compile. */
  readonly mark: () => JSX.Element;
  readonly run: (address: string, signal: AbortSignal) => Promise<ToolOutcome>;
}

/**
 * Every tool the console can run. Nothing else in the console names one: the
 * picker, the consolidated score, the hand-off and the report all read this
 * array, so a fourth reading appears in all four places at once.
 */
export type ToolRegistry = readonly ToolDescriptor[];

/** Ids that are not in the registry are dropped rather than trusted. */
export function toolsById(registry: ToolRegistry, ids: readonly string[]): ToolDescriptor[] {
  return registry.filter((tool) => ids.includes(tool.id));
}
