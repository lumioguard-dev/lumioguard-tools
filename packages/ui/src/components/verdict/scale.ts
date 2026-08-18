/**
 * What a tool's ladder looks like on the instrument.
 *
 * Injected rather than imported, because the two things that vary between tools
 * are the bands themselves and the word struck into the seal — everything else
 * about drawing a verdict is the same. Passing this keeps the components free of
 * any one tool's vocabulary.
 */
export interface InkedBand {
  readonly tier: string;
  readonly from: number;
  readonly to: number;
  readonly description: string;
  readonly ink: string;
  readonly track: { readonly left: number; readonly width: number };
}

export interface VerdictScale {
  readonly bands: readonly InkedBand[];
  /** Top of the track. The needle is clamped to it. */
  readonly max: number;
  readonly inkFor: (tier: string) => string;
  /** The wordmark struck into the die. */
  readonly wordmark: string;
}
