import type { Rule } from './Rule.js';

export interface RuleFilter {
  readonly excludeRules?: readonly string[];
  readonly excludeCategories?: readonly string[];
  readonly onlyCategories?: readonly string[];
}

/**
 * Adding a rule never means editing the analyzer. The filter exists for the
 * evaluation harness: scoring a `*.lovable.app` sample with the hostname
 * fingerprint enabled measures the hostname, not the page.
 */
export class RuleRegistry {
  private readonly rules: Rule[] = [];
  private readonly ids = new Set<string>();

  public register(...rules: readonly Rule[]): this {
    for (const rule of rules) {
      if (this.ids.has(rule.id)) throw new Error(`Duplicate rule id: ${rule.id}`);
      this.ids.add(rule.id);
      this.rules.push(rule);
    }
    return this;
  }

  public get size(): number {
    return this.rules.length;
  }

  public all(): readonly Rule[] {
    return Object.freeze([...this.rules]);
  }

  public find(id: string): Rule | undefined {
    return this.rules.find((rule) => rule.id === id);
  }

  public select(filter: RuleFilter = {}): readonly Rule[] {
    const excludedRules = new Set(filter.excludeRules ?? []);
    const excludedCategories = new Set(filter.excludeCategories ?? []);
    const onlyCategories =
      filter.onlyCategories === undefined ? null : new Set(filter.onlyCategories);

    return this.rules.filter((rule) => {
      if (excludedRules.has(rule.id)) return false;
      if (excludedCategories.has(rule.category)) return false;
      if (onlyCategories !== null && !onlyCategories.has(rule.category)) return false;
      return true;
    });
  }
}
