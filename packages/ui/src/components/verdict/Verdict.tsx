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
  readonly subject: string;
  /**
   * Shown in place of the verdict while the read runs. The panel is on screen from
   * the first moment, so the wait is spent HERE rather than in a separate box that
   * appears and then vanishes.
   */
  readonly waiting?: ReactNode;
  /** Where to go next. Sits directly under the meter, once there is a reading. */
  readonly actions?: ReactNode;
  /** Reads a different site. In the head, opposite the address it replaces. */
  readonly onNewSite: () => void;
}

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
  // The prop goes away the instant the read lands, so without a copy the narration
  // vanishes on the same frame the needle starts closing.
  const held = useRef<ReactNode>(null);
  if (waiting !== undefined) held.current = waiting;

  return (
    <Panel hand="c" red span={12} className={phase === 'done' ? 'is-stamping' : 'is-armed'}>
      <div className="seal-jolt flex flex-1 flex-col">
        {/* The way back sits opposite the subject it replaces, and is reachable while
            the read runs. Beside the way on, their hit areas measured 3px apart on a
            phone. `sm:ml-auto`, or a wrapped line strands it against the right edge. */}
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

        {/* BOTH states render the same two children, so the band keeps its identity
            across the change and the sweep is never interrupted. Stretched, not
            items-start: the taller die left the way on 76px above the panel floor. */}
        <div className={`verdict-grid mt-6 grid gap-y-7 ${open ? 'is-open' : ''}`}>
          {/* Clipped only while the column opens, released before the stamp so the
              splash can bleed. HIDDEN below 768px until it holds something: an empty
              figure still claimed its row gap, 28px of nothing above the meter. */}
          <div
            key="figure"
            className={`min-w-0 flex-col ${open ? 'flex' : 'hidden md:flex'} ${
              phase === 'opening' ? 'overflow-clip' : ''
            }`}
          >
            {open && (
              <>
                {/* Its space is HELD from the moment the column opens: arriving into a
                    gap it had to make itself, it shoved the figure 176px down the page
                    on the one beat meant to be a single decisive strike. */}
                <div className={SEAL_H}>
                  {phase === 'done' && <Seal tier={tier} scale={scale} />}
                </div>

                {/* Set to the DIE's centre, not the column's: the stamp is narrower
                    than the column, so centring in the column put the figure 12px off
                    the mark it belongs to. */}
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
              {/* The marker's resting place must be the score from the moment the
                  settle starts, because the sweep's offsets are measured against it.
                  Left at 0 through the closing pass, the needle ran off the band. */}
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
