import type { ReactNode } from 'react';
import { useRef } from 'react';
import { Panel } from '../Panel.js';
import { FIGURE_TYPE } from '../PendingScore.js';
import { PendingScore } from '../PendingScore.js';
import { Subject } from '../Subject.js';

import { Band } from './Band.js';
import type { VerdictScale } from './scale.js';

import { SEAL_H, SEAL_W, Seal } from './Seal.js';

import { useVerdictSequence } from './useVerdictSequence.js';

interface VerdictProps {
  readonly score: number;
  readonly tier: string;
  readonly scale: VerdictScale;
  /** The address this reading is about. */
  readonly subject: string;
  /**
   * Shown in place of the verdict while the read is running. The panel is on
   * screen from the first moment, so this is where the wait is spent rather
   * than in a separate box that appears and then vanishes.
   */
  readonly waiting?: ReactNode;
  /** Where to go next. Sits directly under the meter, once there is a reading. */
  readonly actions?: ReactNode;
  /** Reads a different site. In the head, opposite the address it replaces. */
  readonly onNewSite: () => void;
}

/** The reading and the band it fell in: the first thing on the results page. */
export function Verdict({
  score,
  tier,
  scale,
  subject,
  waiting,
  actions,
  onNewSite,
}: VerdictProps): JSX.Element {
  const isWaiting = waiting !== undefined;
  const { phase, shown, open, needle, track } = useVerdictSequence(score, isWaiting);
  /**
   * The last passes rendered. The prop goes away the instant the read lands, so
   * without a copy the narration would vanish on the same frame the needle
   * starts closing instead of stepping aside for it.
   */
  const held = useRef<ReactNode>(null);
  if (waiting !== undefined) held.current = waiting;

  return (
    <Panel hand="c" red span={12} className={phase === 'done' ? 'is-stamping' : 'is-armed'}>
      <div className="seal-jolt flex flex-1 flex-col">
        {/* The heading names its own subject. A sentence beneath it spent a
            whole line saying what the title could carry, and the address is
            the one thing here nobody should have to hunt for.

            The way back sits opposite it, because the heading names the subject
            and that control replaces it. It used to live beside the way on,
            where their hit areas measured 3px apart on a phone. Here it is also
            reachable while the read is still running, which it never was: the
            head renders from the first moment, and a 15-to-20-second scan with
            no way out of it was a wait the visitor could not leave.

            `sm:ml-auto`, not `ml-auto`: wrapped onto its own line on a narrow
            screen, an auto margin would strand it against the right edge under
            a left-aligned title. */}
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
          <p className="pen-title flex flex-wrap items-baseline gap-x-[9px] gap-y-1">
            The reading
            <span aria-hidden="true" className="text-ink-3">
              ·
            </span>
            <Subject address={subject} />
          </p>

          {/* The padding is hit area only, pulled back out by the negative
              margin, so a thumb gets 44px of it without the link growing. */}
          <button
            type="button"
            onClick={onNewSite}
            className="-my-[9px] border-0 bg-transparent px-0 py-[9px] font-sans text-14 font-medium text-ink-2 underline decoration-pen-700 decoration-1 underline-offset-[5px] transition-colors hover:text-hand hover:decoration-hand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pen-400 sm:ml-auto"
          >
            Read another site
          </button>
        </div>

        {/* While the read runs there is no figure to show, so the meter takes
            the whole panel rather than sitting beside an empty slot. Once there
            is one, the left column takes what the figure and the die need and
            no more: on a twelve-column split it was 358px holding a 176px
            stamp, which left 246px of blank paper between the verdict and the
            instrument that produced it.

            Both states render the same two children, so the band keeps its
            identity across the change and the sweep is never interrupted. */}
        {/* Not items-start: the die makes the left column 51px taller than the
            meter, which left the way on stranded 76px above the panel floor.
            Stretched, the two columns end together and the action sits on the
            same line the stamp does. */}
        <div className={`verdict-grid mt-6 grid gap-y-7 ${open ? 'is-open' : ''}`}>
          {/* Clipped only while the column is opening: anything the figure's
              overshoot puts past the edge is cut rather than laid over the
              meter. Released before the stamp lands, so the splash can bleed.

              Stacked rather than beside on a narrow screen, so an empty figure
              still claimed a row and its gap: 28px of nothing above the meter
              while the read ran. Hidden there until it has something in it;
              from 768px up it stays in the flow at zero width, because a
              display switch cannot be transitioned. */}
          <div
            key="figure"
            className={`min-w-0 flex-col ${open ? 'flex' : 'hidden md:flex'} ${
              phase === 'opening' ? 'overflow-clip' : ''
            }`}
          >
            {open && (
              <>
                {/* The stamp is struck on the reading, so it sits above it. Its
                    space is held from the moment the column opens: arriving
                    into a gap it had to make itself, it shoved the figure 176px
                    down the page on the one beat that is meant to be a single
                    decisive strike. Held, the paper is simply blank until it
                    is stamped. */}
                <div className={SEAL_H}>
                  {phase === 'done' && <Seal tier={tier} scale={scale} />}
                </div>

                {/* Set to the die's centre, not the column's. The stamp is
                    struck at the column's left edge and is narrower than the
                    column it sits in, so centring the figure in the column put
                    it 12px off the mark it belongs to. Measured from the die
                    itself, the two share an axis at any width. */}
                <span
                  className={`figure-in mt-5 flex items-baseline justify-center gap-[9px] ${SEAL_W}`}
                >
                  {shown === null ? (
                    <PendingScore />
                  ) : (
                    <span className={`text-ink-1 ${FIGURE_TYPE}`}>{shown}</span>
                  )}
                  <span className="denominator-in text-16 font-semibold tabular-nums text-ink-3">
                    / 100
                  </span>
                </span>
              </>
            )}
          </div>

          <div key="meter" className="flex min-w-0 flex-col">
            {/* the needle rides on transform, never `left`, so the sweep never
                touches layout */}
            <div ref={track} className={open ? 'mt-[10px]' : ''}>
              {/* The marker's resting place must be the score from the moment
                  the settle starts, because the sweep's offsets are measured
                  against it. Left at 0 through the closing pass, the needle ran
                  off the left end of the band. `tuning` is what keeps the zone
                  unlit until the meter has actually opened. */}
              <Band
                scale={scale}
                score={phase === 'waiting' ? 0 : score}
                tier={tier}
                tuning={!open}
                markerRef={needle}
              />
            </div>

            {open ? (
              <div className="rise-in mt-auto pt-7">{actions}</div>
            ) : (
              <div className={phase === 'closing' ? 'pass-out' : ''}>{held.current}</div>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
