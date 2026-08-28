import { type RefObject, useEffect, useRef, useState } from 'react';

/**
 * `closing` the needle locks on, `opening` the meter contracts and the figure is
 * written in, `done` the stamp comes down. Each beat waits for the one before it.
 */
type VerdictPhase = 'waiting' | 'closing' | 'opening' | 'done';

interface VerdictSequence {
  readonly phase: VerdictPhase;
  readonly shown: number | null;
  /** True once the figure has a column of its own to sit in. */
  readonly open: boolean;
  readonly needle: RefObject<HTMLSpanElement>;
  readonly track: RefObject<HTMLDivElement>;
}

/** How long the meter takes to make room, matching the CSS transition. */
const OPEN_MS = 700;

/** Wide passes, the way a dial is hunted when the station is not known yet. */
const HUNT = [2, 84, 14, 70, 30, 58, 8, 92, 2];
/** Closing in, once it is. */
const CLOSING = [88, 19, 74, 33, 61, 41, 53];

/** Keyframe offsets that give equal time to equal distance. */
function byDistance(path: readonly number[]): number[] {
  const legs = path.map((point, i) => (i === 0 ? 0 : Math.abs(point - (path[i - 1] ?? point))));
  const total = legs.reduce((sum, leg) => sum + leg, 0);
  if (total === 0) return legs.map((_, i) => (i === 0 ? 0 : 1));
  let run = 0;
  return legs.map((leg) => {
    run += leg;
    return run / total;
  });
}

function currentTranslate(element: Element): number {
  const transform = getComputedStyle(element).transform;
  if (transform === 'none') return 0;
  try {
    return new DOMMatrixReadOnly(transform).m41;
  } catch {
    return 0;
  }
}

/**
 * The needle IS the progress indicator: it hunts in wide passes for as long as the
 * read takes, then closes on the answer and locks.
 */
export function useVerdictSequence(score: number, isWaiting: boolean): VerdictSequence {
  const [phase, setPhase] = useState<VerdictPhase>(isWaiting ? 'waiting' : 'done');
  const [shown, setShown] = useState<number | null>(isWaiting ? null : score);
  const needle = useRef<HTMLSpanElement>(null);
  const track = useRef<HTMLDivElement>(null);
  /** Where the hunt had got to, as a fraction of the track rather than pixels. */
  const carry = useRef(0);

  useEffect(() => {
    const el = needle.current;
    const width = track.current?.getBoundingClientRect().width ?? 0;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isWaiting) {
      setPhase('waiting');
      setShown(null);
      if (reduce || el === null || width <= 0) return;

      /*
       * NO easing here: `easing` in the options eases the whole iteration rather
       * than each pass, bringing the needle to a dead stop at the seam every 5.2s.
       * Linear at a distance-paced tempo, the loop has no seam to see.
       */
      const sweep = HUNT.map((p) => (p / 100) * width);
      const at = byDistance(sweep);
      const hunt = el.animate(
        sweep.map((x, i) => ({ transform: `translateX(${x}px)`, offset: at[i] ?? null })),
        { duration: 5200, iterations: Number.POSITIVE_INFINITY },
      );
      return () => {
        carry.current = currentTranslate(el) / width;
        hunt.cancel();
      };
    }

    if (reduce || el === null || width <= 0) {
      setPhase('done');
      setShown(score);
      return;
    }

    let cancelled = false;
    const timers: number[] = [];
    const wait = (ms: number): Promise<void> =>
      new Promise((r) => timers.push(window.setTimeout(r, ms)));

    setPhase('closing');

    // The marker's resting place moved to the score the moment it arrived, so the
    // first keyframe cancels that shift out and the needle stays where the hunt left it.
    const base = (score / 100) * width;
    const frames = [
      carry.current * width - base,
      ...CLOSING.map((p) => ((p - score) / 100) * width),
      0,
    ];

    /*
     * Paced by DISTANCE, so the settle picks the needle up at the speed the hunt was
     * running it and the first pass is right whatever the hunt was doing. Only the
     * last pass eases: linear to the end reads as the animation simply stopping.
     */
    const settleAt = byDistance(frames);
    const closing = frames.length - 2;
    const settle = el.animate(
      frames.map((x, i) => ({
        transform: `translateX(${x}px)`,
        offset: settleAt[i] ?? null,
        easing: i === closing ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'linear',
      })),
      { duration: 1500, fill: 'forwards' },
    );

    const run = async (): Promise<void> => {
      await Promise.race([settle.finished.catch(() => undefined), wait(1800)]);
      settle.cancel();
      if (cancelled) return;

      // The needle has locked: the meter makes room, and the stamp waits until that
      // space actually exists.
      setPhase('opening');

      // the figure catches up to where the needle already is
      const start = performance.now();
      await new Promise<void>((done) => {
        const stop = window.setTimeout(() => done(), 900);
        timers.push(stop);
        const step = (t: number): void => {
          if (cancelled) {
            done();
            return;
          }
          const k = Math.min(1, (t - start) / 620);
          setShown(Math.round(score * (1 - (1 - k) ** 3)));
          if (k < 1) requestAnimationFrame(step);
          else {
            clearTimeout(stop);
            done();
          }
        };
        requestAnimationFrame(step);
      });
      if (!cancelled) setShown(score);
      await wait(Math.max(0, OPEN_MS - 620));
      if (!cancelled) setPhase('done');
    };

    void run();
    return () => {
      cancelled = true;
      for (const timer of timers) clearTimeout(timer);
    };
  }, [isWaiting, score]);

  return { phase, shown, open: phase === 'opening' || phase === 'done', needle, track };
}
