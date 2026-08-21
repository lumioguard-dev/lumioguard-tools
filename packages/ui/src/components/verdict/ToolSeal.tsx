import { drawn } from '@lumioguard/design-tokens';

/**
 * One reading's own verdict, stamped at the head of its own section.
 *
 * The consolidated verdict at the top of the page is a round seal, and this is
 * deliberately not a second one: a die large enough for `LIGHTLY TEMPLATED`
 * is taller than the heading it sits beside, and left ninety pixels of nothing
 * under a one-line title. It is a RECTANGLE set to the height of that title, so
 * the heading reads as one line with a stamp at the end of it.
 *
 * It cannot simply be lifted out of the flow instead: the rows below carry
 * their cost in the same right-hand column the stamp would then hang over.
 *
 * The number and the tool's own word for it, and nothing else. The tool's name
 * was on the stamp and came off: the heading it sits beside already says what
 * the section is, so the name repeated it, and a reading is a concern rather
 * than a product a visitor should have to learn the name of.
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
        // Struck rather than printed: off the square by a degree, drawn corners,
        // and the tool's own ink for the band on both the frame and the text.
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
