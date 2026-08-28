import { pen } from '@lumioguard/design-tokens';
import type { VerdictScale } from './scale.js';

/** A drawn timeline, not a progress bar and not a segmented control. */
export function Band({
  score,
  tier,
  scale,
  /** During the scan the instrument does not yet know the band, so none is lit. */
  tuning = false,
  markerRef,
}: {
  readonly score: number;
  readonly tier: string;
  readonly scale: VerdictScale;
  readonly tuning?: boolean;
  /** The scan sweeps this element; it must be the real marker, not a proxy. */
  readonly markerRef?: React.Ref<HTMLSpanElement>;
}): JSX.Element {
  const { bands: BANDS, max: SCORE_MAX } = scale;
  const pos = Math.max(0, Math.min(SCORE_MAX, score));
  const live = BANDS.find((b) => b.tier === tier);

  return (
    <div>
      <div
        className="relative h-[46px]"
        role="img"
        aria-label={`${score} out of 100, in the ${tier} band, which runs from ${
          live?.from ?? 0
        } to ${live?.to ?? SCORE_MAX}.`}
      >
        {BANDS.map((b) => {
          const { left, width } = b.track;
          const isLive = !tuning && b.tier === tier;
          return (
            <span
              key={b.tier}
              className="absolute bottom-[3px] top-[2px] rounded-drawn-bar"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                // color-mix, never a hex alpha: the inks are `var()` strings, and
                // `var(--x)16` paints nothing at all.
                background: `color-mix(in srgb, ${b.ink} ${isLive ? 24 : 9}%, transparent)`,
              }}
            />
          );
        })}

        <svg
          viewBox="0 0 1000 46"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible fill-none stroke-pen-600"
          aria-hidden="true"
          strokeLinecap="round"
        >
          <g vectorEffect="non-scaling-stroke">
            <path
              vectorEffect="non-scaling-stroke"
              strokeWidth={1.9}
              d="M2 42.4C118 40.9 232 43.3 349 41.8c142-1.8 284 1.9 426 .4 74-.8 148 .7 222 .1"
            />
            {[200, 400, 600].map((x, i) => (
              <path
                key={x}
                vectorEffect="non-scaling-stroke"
                className="stroke-pen-700"
                strokeWidth={1.2}
                opacity={0.75}
                d={
                  i % 2 === 0
                    ? `M${x} 9.5c1.4 10.6 1.1 21.2-.4 31.8`
                    : `M${x} 9c-1.2 10.9-.9 21.7.6 32.4`
                }
              />
            ))}
            {Array.from({ length: 11 }, (_, i) => {
              const x = i === 0 ? 3 : i === 10 ? 997 : i * 100;
              const major = i % 2 === 0;
              const lean = i % 3 === 0 ? 1 : -1;
              return (
                <path
                  key={`tick-${x}`}
                  vectorEffect="non-scaling-stroke"
                  className={major ? 'stroke-pen-600' : 'stroke-pen-700'}
                  strokeWidth={major ? 1.7 : 1.4}
                  d={
                    major
                      ? `M${x} 26.4c${lean * 0.6} 5.2 ${lean * 0.4} 10.4-.3 15.6`
                      : `M${x} 33.5c${lean * 0.5} 2.9 ${lean * 0.4} 5.8-.2 8.6`
                  }
                />
              );
            })}
          </g>
        </svg>

        <span
          ref={markerRef}
          className="absolute bottom-[1px] top-[-11px] z-[3] w-[2.6px] rounded-[2px_1px_2px_1px]"
          style={{
            left: `${pos}%`,
            background: tuning ? pen[600] : (live?.ink ?? pen[600]),
          }}
        >
          <span
            className="absolute left-[-5.2px] top-[-2px] border-x-[6.4px] border-x-transparent border-t-[9.5px]"
            style={{ borderTopColor: tuning ? pen[600] : (live?.ink ?? pen[600]) }}
          />
        </span>

        {[0, 20, 40, 60, 80, 100].map((n) => (
          <span
            key={n}
            className="absolute bottom-[-25px] text-caption tabular-nums text-ink-3"
            style={{
              left: `${n}%`,
              transform: n === 0 ? 'none' : n === 100 ? 'translateX(-100%)' : 'translateX(-50%)',
            }}
          >
            {n}
          </span>
        ))}
      </div>

      {/* 14px is the ceiling: at 16px the two centre names collide. The end stations
          are ANCHORED to the ends of the track, not centred on their zones: a name is
          wider than a fifth of a narrow track and hung 9px off the left end. */}
      <div className="relative mt-[36px] h-[26px]">
        {BANDS.map((b, index) => {
          const { left, width } = b.track;
          const isLive = !tuning && b.tier === tier;
          const isFirst = index === 0;
          const isLast = index === BANDS.length - 1;
          return (
            <span
              key={b.tier}
              className={`absolute whitespace-nowrap font-hand leading-tight ${
                isLive ? 'text-18' : 'text-14'
              } ${isLive ? '' : 'hidden lg:block'}`}
              style={{
                left: `${isFirst ? left : isLast ? left + width : left + width / 2}%`,
                transform: isFirst ? 'none' : isLast ? 'translateX(-100%)' : 'translateX(-50%)',
                color: b.ink,
              }}
            >
              {b.tier}
            </span>
          );
        })}
      </div>
    </div>
  );
}
