import type { RuleCategoryValue } from './RuleCategory.js';
import type { ScoreAxisValue } from './ScoreAxis.js';

export class Finding {
  public readonly ruleId: string;
  public readonly label: string;
  public readonly category: RuleCategoryValue;
  public readonly axis: ScoreAxisValue;
  public readonly weight: number;
  public readonly evidence: string | null;
  public readonly error: string | null;
  /** This tell as a short noun phrase. See `Rule.phrase`. */
  public readonly phrase: string | null;

  private constructor(init: {
    ruleId: string;
    label: string;
    category: RuleCategoryValue;
    axis: ScoreAxisValue;
    weight: number;
    evidence: string | null;
    error: string | null;
    phrase?: string | null;
  }) {
    this.ruleId = init.ruleId;
    this.label = init.label;
    this.category = init.category;
    this.axis = init.axis;
    this.weight = init.weight;
    this.evidence = init.evidence;
    this.error = init.error;
    this.phrase = init.phrase ?? null;
    Object.freeze(this);
  }

  public static observed(init: {
    ruleId: string;
    label: string;
    category: RuleCategoryValue;
    axis: ScoreAxisValue;
    weight: number;
    evidence: string | null;
    phrase?: string | null;
  }): Finding {
    return new Finding({ ...init, error: null });
  }

  /** Zero weight, so one broken rule cannot silently shift a page's score. */
  public static failed(init: {
    ruleId: string;
    label: string;
    category: RuleCategoryValue;
    axis: ScoreAxisValue;
    error: string;
  }): Finding {
    return new Finding({ ...init, weight: 0, evidence: null, error: init.error });
  }

  public get isScored(): boolean {
    return this.axis === 'slop' && this.error === null;
  }

  public get isPenalty(): boolean {
    return this.isScored && this.weight > 0;
  }

  public get isCredit(): boolean {
    return this.isScored && this.weight < 0;
  }
}
