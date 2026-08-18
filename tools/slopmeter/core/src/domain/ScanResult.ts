import type { Tier } from '@lumioguard/shared';
import { headlineFor } from '../scoring/Headline.js';
import type { Finding } from './Finding.js';
import type { Score } from './Score.js';

export interface AssessmentCaveats {
  readonly isClientRendered: boolean;
  readonly wasTruncated: boolean;
}

/** Partitioned by axis at construction, so no caller can total a quality defect as slop. */
export class ScanResult {
  public readonly url: string | null;
  public readonly host: string | null;
  public readonly title: string | null;
  public readonly score: Score;
  public readonly tier: Tier;
  public readonly findings: readonly Finding[];
  public readonly qualityFindings: readonly Finding[];
  public readonly provenanceFindings: readonly Finding[];
  public readonly unassessableFindings: readonly Finding[];
  public readonly caveats: AssessmentCaveats;

  public constructor(init: {
    url: string | null;
    host: string | null;
    title: string | null;
    score: Score;
    tier: Tier;
    findings: readonly Finding[];
    qualityFindings: readonly Finding[];
    provenanceFindings: readonly Finding[];
    unassessableFindings: readonly Finding[];
    caveats: AssessmentCaveats;
  }) {
    this.url = init.url;
    this.host = init.host;
    this.title = init.title;
    this.score = init.score;
    this.tier = init.tier;
    this.findings = Object.freeze([...init.findings]);
    this.qualityFindings = Object.freeze([...init.qualityFindings]);
    this.provenanceFindings = Object.freeze([...init.provenanceFindings]);
    this.unassessableFindings = Object.freeze([...init.unassessableFindings]);
    this.caveats = Object.freeze({ ...init.caveats });
    Object.freeze(this);
  }

  /**
   * The one line worth repeating about this page, taken from the heaviest tell
   * that has something to say. Null when nothing scored does.
   */
  public get headline(): string | null {
    return headlineFor(this.findings);
  }

  public get penaltyCount(): number {
    return this.findings.filter((f) => f.isPenalty).length;
  }

  public get creditCount(): number {
    return this.findings.filter((f) => f.isCredit).length;
  }
}
