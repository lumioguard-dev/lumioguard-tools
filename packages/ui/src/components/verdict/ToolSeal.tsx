import { drawn } from '@lumioguard/design-tokens';

/**
 * A RECTANGLE, not a second round seal: a die large enough for the longest tier is
 * taller than the heading and left ninety pixels of nothing under a one-line title.
 */
export function ToolSeal({
  score,
  tier,
  ink,
}: {
  readonly score: number;
  readonly tier: string;
  /** The tool's own ink for this band, so the stamp matches its own report. */
  readonly ink: string;
}): JSX.Element {
  return (
    <span
      className="inline-flex shrink-0 items-baseline gap-[9px] border-2 px-[11px] py-[5px] leading-none"
      style={{
        // The tool's own ink for the band, on both the frame and the text.
        borderRadius: drawn.chip,
        borderColor: ink,
        color: ink,
        transform: 'rotate(-1.3deg)',
      }}
      role="img"
      aria-label={`${score} out of 100, ${tier}`}
    >
      <span className="font-sans text-17 font-extrabold tabular-nums">{score}</span>
      <span className="font-hand text-15">{tier}</span>
    </span>
  );
}
