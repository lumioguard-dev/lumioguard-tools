import { ToolSeal } from '@lumioguard/ui';
import type { Reading } from '../scan/useReadings.js';

/**
 * One reading's panels, with its own verdict stamped into their heading.
 *
 * The verdict had a strip of its own above the section. Two panels, the tool's
 * name in both, and the number a screen apart from the findings it was the sum
 * of; it is now handed to the tool, which places it in the heading of its own
 * first panel. The console still knows none of the three response shapes.
 */
export function ReadingSection({ reading }: { readonly reading: Reading }): JSX.Element | null {
  const outcome = reading.outcome;
  if (outcome === null) return null;

  return (
    <>{outcome.render(<ToolSeal score={outcome.score} tier={outcome.tier} ink={outcome.ink} />)}</>
  );
}
