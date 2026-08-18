import { PageContextFactory } from './analysis/PageContextFactory.js';
import { Finding } from './domain/Finding.js';
import type { PageSnapshot } from './domain/PageSnapshot.js';
import { ScanResult } from './domain/ScanResult.js';
import { ScoreAxis } from './domain/ScoreAxis.js';
import { AxisPolicy, type AxisPolicyOptions } from './rules/AxisPolicy.js';
import type { RuleFilter, RuleRegistry } from './rules/RuleRegistry.js';
import { ScoreCalculator } from './scoring/ScoreCalculator.js';
import { TierResolver } from './scoring/TierResolver.js';

export interface AnalyzeOptions extends RuleFilter, AxisPolicyOptions {}

/**
 * Runs the registry against one snapshot and assembles the result.
 *
 * Collaborators are injected rather than constructed so the harness can swap
 * a registry or a tier scale without touching this class.
 */
export class SlopAnalyzer {
  private readonly registry: RuleRegistry;
  private readonly contextFactory: PageContextFactory;
  private readonly scoreCalculator: ScoreCalculator;
  private readonly tierResolver: TierResolver;

  public constructor(
    registry: RuleRegistry,
    dependencies: {
      contextFactory?: PageContextFactory;
      scoreCalculator?: ScoreCalculator;
      tierResolver?: TierResolver;
    } = {},
  ) {
    this.registry = registry;
    this.contextFactory = dependencies.contextFactory ?? new PageContextFactory();
    this.scoreCalculator = dependencies.scoreCalculator ?? new ScoreCalculator();
    this.tierResolver = dependencies.tierResolver ?? new TierResolver();
  }

  public analyze(snapshot: PageSnapshot, options: AnalyzeOptions = {}): ScanResult {
    const context = this.contextFactory.create(snapshot);
    const axisPolicy = new AxisPolicy(options);
    const isClientRendered = context.content.isClientRendered;

    const findings: Finding[] = [];
    for (const rule of this.registry.select(options)) {
      const axis = axisPolicy.axisFor(rule, isClientRendered);
      const outcome = rule.execute(context);

      if (outcome.error !== null) {
        findings.push(
          Finding.failed({
            ruleId: rule.id,
            label: rule.label,
            category: rule.category,
            axis,
            error: outcome.error,
          }),
        );
        continue;
      }
      if (outcome.evidence === null) continue;

      findings.push(
        Finding.observed({
          ruleId: rule.id,
          label: rule.label,
          category: rule.category,
          axis,
          weight: rule.weight,
          evidence: outcome.evidence,
          phrase: rule.phrase,
        }),
      );
    }

    findings.sort((a, b) => b.weight - a.weight);

    const byAxis = (axis: string): Finding[] => findings.filter((f) => f.axis === axis);
    const scored = byAxis(ScoreAxis.Slop);
    const score = this.scoreCalculator.calculate(scored);

    return new ScanResult({
      url: context.url?.toString() ?? null,
      host: snapshot.host,
      title: context.document.title === '' ? null : context.document.title,
      score,
      tier: this.tierResolver.resolve(score.value),
      findings: scored,
      qualityFindings: byAxis(ScoreAxis.Quality),
      provenanceFindings: byAxis(ScoreAxis.Provenance),
      unassessableFindings: byAxis(ScoreAxis.Unassessable),
      caveats: { isClientRendered, wasTruncated: context.wasTruncated },
    });
  }
}
