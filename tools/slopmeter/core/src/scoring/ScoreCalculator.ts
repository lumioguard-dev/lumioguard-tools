import type { Finding } from '../domain/Finding.js';
import { Score } from '../domain/Score.js';

export class ScoreCalculator {
  public calculate(findings: readonly Finding[]): Score {
    let penalties = 0;
    let credits = 0;
    for (const finding of findings) {
      if (finding.isPenalty) penalties += finding.weight;
      else if (finding.isCredit) credits -= finding.weight;
    }
    return Score.from(penalties, credits);
  }
}
