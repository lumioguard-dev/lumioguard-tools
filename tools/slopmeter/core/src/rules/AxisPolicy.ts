import { PROVENANCE_CATEGORIES } from '../domain/RuleCategory.js';
import { ScoreAxis, type ScoreAxisValue } from '../domain/ScoreAxis.js';
import type { Rule } from './Rule.js';

/** Findings that describe our own blindness rather than the page. */
export const RENDER_DEPENDENT_RULES: ReadonlySet<string> = new Set([
  'structure.thin-shell',
  'structure.no-h1',
  'structure.div-soup',
  'structure.oversized-payload',
  'impeccable.numbered-section-labels',
  'impeccable.shape-assembled-illustration',
]);

/** Reported, never scored. */
export const QUALITY_AXIS_RULES: ReadonlySet<string> = new Set([
  'quality.missing-meta',
  'quality.no-alt-text',
  'quality.missing-lang',
  'quality.skipped-heading',
  'quality.console-log-inline',
  'quality.huge-dom',
  'quality.inline-style-soup',
  'quality.duplicate-headings',
  'impeccable.undersized-functional-text',
  'impeccable.all-caps-body',
  'impeccable.wide-tracking-body',
  'impeccable.repeated-text-in-container',
  'impeccable.low-contrast',
  'impeccable.gray-on-colored',

  // Measured off the axis: fires on 0% of generated pages, 18% of hand-built.
  'structure.oversized-payload',
  // 0% vs 16%: the generated templates all ship a viewport tag.
  'structure.no-viewport',
  // 0.6% vs 17%: real sites ship far more href="#" than templates do.
  'leftover.placeholder-links',
  'impeccable.flat-type-hierarchy',
  'impeccable.hover-scale-transform',
  'craft.layout-transition',
]);

/**
 * Build machinery a visitor never experiences. A Radix primitive, a Vite chunk
 * name and a `_next` path say what the page was assembled with, not how it
 * looks, so they are reported as context and score zero.
 */
const INFORMATIONAL_RULES: ReadonlySet<string> = new Set([
  'default.radix',
  'default.vite-build',
  'default.next-default',
  'default.tailwind-cdn',
]);

export interface AxisPolicyOptions {
  /** Move render-dependent findings off the score for a client-rendered page. */
  readonly suppressShellRules?: boolean;
}

export class AxisPolicy {
  private readonly suppressShellRules: boolean;

  public constructor(options: AxisPolicyOptions = {}) {
    this.suppressShellRules = options.suppressShellRules ?? false;
  }

  public axisFor(rule: Rule, isClientRendered: boolean): ScoreAxisValue {
    if (PROVENANCE_CATEGORIES.has(rule.category) || INFORMATIONAL_RULES.has(rule.id)) {
      return ScoreAxis.Provenance;
    }
    if (this.suppressShellRules && isClientRendered && RENDER_DEPENDENT_RULES.has(rule.id)) {
      return ScoreAxis.Unassessable;
    }
    if (QUALITY_AXIS_RULES.has(rule.id)) return ScoreAxis.Quality;
    return ScoreAxis.Slop;
  }
}
