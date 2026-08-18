import { useEffect, useRef, useState } from 'react';

/** The page under examination, arriving. */

/** Sampling widths in blocks. The last step is the real image, not a canvas. */
const STEPS = [7, 11, 18, 30, 52, 90] as const;
const STEP_MS = 620;

export function ResolvingShot({
  src,
  alt,
  address,
  resolving,
}: {
  readonly src: string;
  readonly alt: string;
  readonly address: string;
  /** True while the read is running. */
  readonly resolving: boolean;
}): JSX.Element | null {
  const [failed, setFailed] = useState(false);
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const reduced =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pixelated = resolving && !reduced && loaded;

  useEffect(() => {
    if (!resolving || reduced) return;
    const tick = window.setInterval(() => {
      setStep((current) => (current < STEPS.length - 1 ? current + 1 : current));
    }, STEP_MS);
    return () => clearInterval(tick);
  }, [resolving, reduced]);

  useEffect(() => {
    if (!pixelated) return;
    const surface = canvas.current;
    const source = image.current;
    if (surface === null || source === null || source.naturalWidth === 0) return;

    const blocks = STEPS[step] ?? STEPS[0];
    const ratio = source.naturalHeight / source.naturalWidth;
    surface.width = blocks;
    surface.height = Math.max(1, Math.round(blocks * ratio));

    const context = surface.getContext('2d');
    if (context === null) return;
    context.clearRect(0, 0, surface.width, surface.height);
    context.drawImage(source, 0, 0, surface.width, surface.height);
  }, [pixelated, step]);

  if (failed) return null;

  return (
    <>
      <figure className="m-0 mt-4 rotate-[-0.55deg]">
        <div className="overflow-hidden rounded-drawn-b border-[1.7px] border-pen-600 bg-paper-sunk">
          <div className="flex items-center gap-[6px] border-b-[1.4px] border-pen-700 px-[11px] py-[7px]">
            <span className="flex shrink-0 items-center gap-[6px]" aria-hidden="true">
              {['left', 'middle', 'right'].map((dot) => (
                <span
                  key={dot}
                  className="block h-2 w-2 rounded-[60%_40%_55%_45%] border-[1.3px] border-pen-700"
                />
              ))}
            </span>
            <span className="ml-[6px] min-w-0 flex-1 truncate text-caption text-ink-3">
              {address}
            </span>
            <span
              className="shrink-0 text-caption text-ink-3"
              title="Rendered by a third party, which is told the address you scanned. A cold address comes back blank and fills in on a later load."
            >
              third-party render
            </span>
          </div>

          <button
            type="button"
            onClick={() => dialog.current?.showModal()}
            disabled={resolving}
            aria-label="Enlarge the render of the scanned page"
            className="relative block w-full cursor-zoom-in border-0 bg-transparent p-0 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-pen-300"
          >
            <img
              ref={image}
              src={src}
              alt={alt}
              width={1200}
              height={900}
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              // 16:9, not a fixed height. The renderer returns a 1200×900
              // frame and a fixed 210/290px box cropped it to whatever that
              // height happened to take — a different slice of the page at
              // every breakpoint. A ratio crops the same way at every width,
              // and the panels either side are spanned to suit it rather than
              // the other way round.
              className="block aspect-[16/9] w-full bg-paper-high object-cover object-top transition-opacity duration-500"
              style={{ opacity: pixelated ? 0 : 1 }}
            />
            {/* No role and no aria-hidden: a canvas with no fallback content
                exposes nothing to begin with, and the img beneath it already
                carries the alt text. */}
            <canvas
              ref={canvas}
              className="pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-500"
              style={{ imageRendering: 'pixelated', opacity: pixelated ? 1 : 0 }}
            />
          </button>
        </div>
      </figure>

      <dialog
        ref={dialog}
        className="w-full max-w-[min(96vw,1200px)] border-0 bg-transparent p-0 backdrop:bg-[color-mix(in_srgb,var(--paper-sunk)_88%,transparent)]"
        aria-label="Enlarged render of the scanned page"
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
        }}
      >
        <div className="rounded-drawn-c border-[1.7px] border-pen-600 bg-paper-sunk p-3">
          <img src={src} alt={alt} className="block h-auto w-full bg-paper-high" />
          <div className="mt-[11px] flex justify-end">
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="rounded-drawn-chip border-2 border-pen-700 px-[18px] py-[9px] font-sans text-15 font-medium text-ink-1 hover:border-pen-600 hover:bg-paper-high"
            >
              Close
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
