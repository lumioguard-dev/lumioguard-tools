import { PROVENANCE_CATEGORIES } from '../domain/RuleCategory.js';
import { ScoreAxis, type ScoreAxisValue } from '../domain/ScoreAxis.js';
import type { Rule } from './Rule.js';

/** Findings that describe our own blindness rather than the page. */
export const RENDER_DEPENDENT_RULES: ReadonlySet<string> = new Set([
  'document.thin-shell',
  'document.no-title-heading',
  'document.generic-boxes',
  'document.heavy-payload',
  'impeccable.numbered-section-labels',
  'impeccable.shape-assembled-illustration',
]);

/** Reported, never scored. */
export const QUALITY_AXIS_RULES: ReadonlySet<string> = new Set([
  'quality.no-social-card',
  'quality.unlabelled-images',
  'quality.no-language',
  'quality.heading-gap',
  'quality.debug-logging',
  'quality.heavy-dom',
  'quality.inline-styles',
  'quality.repeated-headings',
  'impeccable.undersized-functional-text',
  'impeccable.all-caps-body',
  'impeccable.wide-tracking-body',
  'impeccable.repeated-text-in-container',
  'impeccable.low-contrast',
  'impeccable.gray-on-colored',

  // Measured off the axis: fires on 0% of generated pages, 18% of hand-built.
  'document.heavy-payload',
  // 0% vs 16%: the generated templates all ship a viewport tag.
  'document.no-viewport',
  // 0.6% vs 17%: real sites ship far more href="#" than templates do.
  'unfinished.dead-links',
  'impeccable.flat-type-hierarchy',
  'impeccable.hover-scale-transform',
  'finish.layout-animation',
]);

/**
 * Build machinery a visitor never experiences. A Radix primitive, a Vite chunk
 * name and a `_next` path say what the page was assembled with, not how it
 * looks, so they are reported as context and score zero.
 */
const INFORMATIONAL_RULES: ReadonlySet<string> = new Set([
  'stock.primitives',
  'stock.vite-scaffold',
  'stock.next-scaffold',
  'stock.utility-cdn',
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
