import type { PageContext } from '../analysis/PageContext.js';
import type { RuleCategoryValue } from '../domain/RuleCategory.js';

/** Evidence when the rule fires, `null` when it does not. */
type RuleEvaluator = (context: PageContext) => string | null;

interface RuleOutcome {
  readonly evidence: string | null;
  readonly error: string | null;
}

export abstract class Rule {
  public abstract readonly id: string;
  public abstract readonly category: RuleCategoryValue;
  public abstract readonly weight: number;
  public abstract readonly label: string;
  /** This tell as a short noun phrase, for the verdict sentence. */
  public abstract readonly phrase: string | null;

  protected abstract evaluate(context: PageContext): string | null;

  /**
   * Template method. A rule that throws is reported as a failure rather than
   * taken down with the scan: one bad regex must not cost a page its result.
   */
  public execute(context: PageContext): RuleOutcome {
    try {
      return { evidence: this.evaluate(context), error: null };
    } catch (error) {
      return { evidence: null, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

export interface RuleSpec {
  readonly id: string;
  readonly category: RuleCategoryValue;
  readonly weight: number;
  readonly label: string;
  /** See `Rule.phrase`. */
  readonly phrase?: string;
  readonly evaluate: RuleEvaluator;
}

/**
 * Most rules differ only in their predicate, so they are instances of one
 * class rather than ninety subclasses — inheritance here would be ceremony,
 * not structure. Rules that need real behaviour of their own subclass `Rule`.
 */
export class PredicateRule extends Rule {
  public readonly id: string;
  public readonly category: RuleCategoryValue;
  public readonly weight: number;
  public readonly label: string;
  public readonly phrase: string | null;

  private readonly predicate: RuleEvaluator;

  public constructor(spec: RuleSpec) {
    super();
    this.id = spec.id;
    this.category = spec.category;
    this.weight = spec.weight;
    this.label = spec.label;
    this.phrase = spec.phrase ?? null;
    this.predicate = spec.evaluate;
  }

  protected override evaluate(context: PageContext): string | null {
    return this.predicate(context);
  }
}

export function defineRule(spec: RuleSpec): Rule {
  return new PredicateRule(spec);
}
