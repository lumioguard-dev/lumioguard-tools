import { SCORE_MAX } from '@lumioguard/shared';

export class Score {
  public readonly value: number;
  public readonly penalties: number;
  public readonly credits: number;
  public readonly creditCap: number;
  public readonly creditApplied: number;

  private constructor(init: {
    value: number;
    penalties: number;
    credits: number;
    creditCap: number;
    creditApplied: number;
  }) {
    this.value = init.value;
    this.penalties = init.penalties;
    this.credits = init.credits;
    this.creditCap = init.creditCap;
    this.creditApplied = init.creditApplied;
    Object.freeze(this);
  }

  /**
   * Credits cap at half the penalty total: craft can soften a verdict, never
   * erase it.
   *
   * The penalty is subtracted from the top, ONCE, here. The rules produce a
   * cost, because that is what a rule can say; the scale the reader sees runs
   * the other way, and this is the only line that knows it. Everything above
   * counts against the page, everything below reads a number where 100 is a
   * page with nothing stock in it.
   */
  public static from(penalties: number, credits: number): Score {
    const creditCap = Math.floor(penalties / 2);
    const creditApplied = Math.min(credits, creditCap);
    const value = Math.max(0, Math.min(100, SCORE_MAX - (penalties - creditApplied)));
    return new Score({ value, penalties, credits, creditCap, creditApplied });
  }

  public static zero(): Score {
    return Score.from(0, 0);
  }
}
