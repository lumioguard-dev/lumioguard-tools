/** A finding is always reported; the axis decides only whether it can move the score. */
export const ScoreAxis = {
  Slop: 'slop',
  /** Real defects, and rules measured to fire more on hand-built pages than generated ones. */
  Quality: 'quality',
  Provenance: 'provenance',
  /** Structural findings about a body that JavaScript never rendered. Opt-in. */
  Unassessable: 'unassessable',
} as const;

export type ScoreAxisValue = (typeof ScoreAxis)[keyof typeof ScoreAxis];
