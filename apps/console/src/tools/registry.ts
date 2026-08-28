import type { VerdictScale } from '@lumioguard/ui';
import type { ReactNode } from 'react';
import type { ToolCopy } from './catalogue.js';

/**
 * `run` closes over the typed response and hands back a `render`, which is what
 * lets one array hold tools whose wire shapes share nothing, with no cast.
 */
export interface ToolOutcome {
  /** 0-100, higher is BETTER, on the same ladder every tool uses. */
  readonly score: number;
  /** This tool's own word for the band, not the consolidated one. */
  readonly tier: string;
  readonly tierDescription: string;
  /** The ink this tool paints that tier in, so its chip matches its own report. */
  readonly ink: string;
  /** The handle this reading was recorded under, or null when it was not. */
  readonly siteKey: string | null;
  /** `verdict` is handed in: drawn around the section it read as a separate object. */
  readonly render: (verdict: ReactNode) => ReactNode;
  /**
   * Worst first. `cost` is points off the same 0-100 scale every tool uses, so one
   * panel can rank a leak against a stock hero. It rides the WIRE: `web` may not
   * read `core`.
   */
  readonly culprits: readonly {
    readonly id: string;
    readonly title: string;
    readonly note: string | null;
    readonly cost: number;
  }[];
  /**
   * Only for a tool that CRAWLS. Data, not a rendering: the console merges every
   * crawl into ONE page list, where a door each meant two tables of the same URLs.
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
 * Extends `ToolCopy` rather than restating it, so a label cannot mean one thing
 * on the chooser and another in the report.
 */
export interface ToolDescriptor extends ToolCopy {
  /** The drawn mark it is offered under, so a fourth reading needs one to compile. */
  readonly mark: () => JSX.Element;
  /** This tool's own ladder, so a page reading it alone stamps its words. */
  readonly scale: VerdictScale;
  readonly belowAsk?: (onScan: (address: string) => void) => ReactNode;
  readonly run: (address: string, signal: AbortSignal) => Promise<ToolOutcome>;
}

/**
 * Nothing ELSE in the console names a tool: the picker, the consolidated score,
 * the hand-off and the report all read this array.
 */
export type ToolRegistry = readonly ToolDescriptor[];

/** Ids that are not in the registry are dropped rather than trusted. */
export function toolsById(registry: ToolRegistry, ids: readonly string[]): ToolDescriptor[] {
  return registry.filter((tool) => ids.includes(tool.id));
}
