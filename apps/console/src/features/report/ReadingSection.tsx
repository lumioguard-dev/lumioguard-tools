import { ToolSeal } from '@lumioguard/ui';
import type { ToolOutcome } from '../../tools/registry.js';

/**
 * The verdict is handed to the tool, which stamps it into its own first heading:
 * as a strip above the section it put the number a screen from its findings. The
 * console still knows none of the three response shapes.
 */
export function ReadingSection({ outcome }: { readonly outcome: ToolOutcome }): JSX.Element {
  // The fragment is load-bearing: `render` answers a ReactNode and a component
  // must answer an element.
  return (
    <>{outcome.render(<ToolSeal score={outcome.score} tier={outcome.tier} ink={outcome.ink} />)}</>
  );
}
