import type { VerdictScale } from './scale.js';

const BLOBS: readonly {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  readonly dx: string;
  readonly dy: string;
  readonly d: string;
}[] = [
  { cx: 84, cy: 22, rx: 5.5, ry: 4, dx: '-20px', dy: '-26px', d: '20ms' },
  { cx: 128, cy: 16, rx: 3.6, ry: 5.2, dx: '-2px', dy: '-32px', d: '0ms' },
  { cx: 176, cy: 34, rx: 6.2, ry: 4.4, dx: '22px', dy: '-22px', d: '35ms' },
  { cx: 192, cy: 84, rx: 4.4, ry: 5.6, dx: '32px', dy: '-4px', d: '12ms' },
  { cx: 180, cy: 148, rx: 5.8, ry: 4.2, dx: '27px', dy: '20px', d: '28ms' },
  { cx: 124, cy: 182, rx: 4.2, ry: 5.4, dx: '3px', dy: '33px', d: '8ms' },
  { cx: 62, cy: 168, rx: 6, ry: 4, dx: '-23px', dy: '27px', d: '40ms' },
  { cx: 20, cy: 118, rx: 4.6, ry: 5.8, dx: '-34px', dy: '8px', d: '18ms' },
  { cx: 26, cy: 58, rx: 5.2, ry: 4.6, dx: '-31px', dy: '-16px', d: '30ms' },
];

/** A two-word tier stacks, so the die stays balanced whichever ladder it is. */
function linesOf(tier: string): readonly string[] {
  return tier.split(/[\s-]+/).filter((word: string) => word !== '');
}

/**
 * The inner ring leaves a chord of about 142 units, so the LONGEST word decides the
 * size rather than every tier being set at the size that suits the shortest.
 */
function tierSize(lines: readonly string[]): number {
  const longest = Math.max(...lines.map((word) => word.length));
  if (longest <= 4) return 30;
  if (longest <= 5) return 27;
  if (longest <= 7) return 24;
  return 20;
}

export const SEAL_W = 'w-[168px] lg:w-[176px]';
export const SEAL_H = 'h-[168px] lg:h-[176px]';

export function Seal({
  tier,
  scale,
}: { readonly tier: string; readonly scale: VerdictScale }): JSX.Element {
  const ink = scale.inkFor(tier);
  const lines = linesOf(tier);
  const size = tierSize(lines);
  const step = Math.round(size * 1.08);
  const firstY = lines.length > 1 ? 100 - step / 2 + size * 0.36 : 100 + size * 0.36;

  return (
    <span className={`seal-wrap relative block self-start [perspective:900px] ${SEAL_W}`}>
      <svg
        viewBox="0 0 200 200"
        className="splash pointer-events-none absolute left-[-14px] top-[-14px] h-[calc(100%+28px)] w-[calc(100%+28px)] overflow-visible opacity-0"
        style={{ fill: ink }}
        aria-hidden="true"
      >
        {BLOBS.map((b) => (
          <ellipse
            key={`${b.cx}-${b.cy}-${b.rx}`}
            cx={b.cx}
            cy={b.cy}
            rx={b.rx}
            ry={b.ry}
            style={{ '--dx': b.dx, '--dy': b.dy, '--d': b.d } as React.CSSProperties}
          />
        ))}
      </svg>

      <svg
        viewBox="0 0 200 200"
        className="seal relative block h-auto w-full"
        style={{ transform: 'rotate(-3.2deg)' }}
        role="img"
        aria-label={`Verdict: ${tier}`}
      >
        <defs>
          <filter id="seal-die" x="-12%" y="-12%" width="124%" height="124%">
            {/* the edge, chewed rather than cut */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.038"
              numOctaves={4}
              seed={9}
              result="edge"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="edge"
              scale={4.6}
              xChannelSelector="R"
              yChannelSelector="G"
              result="eroded"
            />
            {/* ink the die did not take from the pad */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.62"
              numOctaves={4}
              seed={3}
              result="grain"
            />
            <feColorMatrix in="grain" type="luminanceToAlpha" result="lum" />
            <feComponentTransfer in="lum" result="holes">
              <feFuncA type="discrete" tableValues="0 0 0 0 0 1" />
            </feComponentTransfer>
            <feComposite in="eroded" in2="holes" operator="out" />
          </filter>
        </defs>

        <g filter="url(#seal-die)" fill={ink} stroke={ink}>
          <circle cx={100} cy={100} r={93} fill="none" strokeWidth={6} />
          <circle cx={100} cy={100} r={72} fill="none" strokeWidth={2.2} />

          {/* the die's own furniture, at nine and three */}
          <circle cx={13} cy={100} r={4.2} stroke="none" />
          <circle cx={187} cy={100} r={4.2} stroke="none" />

          {/* The die carries the band and NOTHING else: the tool's name and the word
              VERDICT said twice what the page around it already says once. */}
          <text
            className="font-sans"
            x={100}
            textAnchor="middle"
            fontSize={size}
            fontWeight={800}
            letterSpacing={1.4}
            stroke="none"
          >
            {lines.map((word, index) => (
              <tspan key={word} x={100} y={firstY + index * step}>
                {word.toUpperCase()}
              </tspan>
            ))}
          </text>
        </g>
      </svg>
    </span>
  );
}
