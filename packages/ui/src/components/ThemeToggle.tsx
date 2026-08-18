import type { ThemeName } from '@lumioguard/design-tokens';

/**
 * Drawn, like everything else that carries meaning here: a sun whose rays are
 * uneven strokes, a moon that is one bowed crescent. An icon font or an emoji
 * would be the one mark on the page nobody's hand made.
 *
 * It shows what you will get, not what you have, and says so in words to a
 * screen reader, because a lone glyph cannot be read either way round.
 */
export function ThemeToggle({
  theme,
  onToggle,
  className = '',
}: {
  readonly theme: ThemeName;
  readonly onToggle: () => void;
  readonly className?: string;
}): JSX.Element {
  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${next} paper`}
      title={`Switch to ${next} paper`}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-drawn-chip border-[1.6px] border-pen-700 bg-transparent text-hand transition-colors hover:border-pen-600 hover:bg-paper-high focus-visible:border-pen-400 ${className}`}
    >
      <svg
        viewBox="0 0 22 22"
        className="h-[17px] w-[17px] fill-none stroke-current"
        aria-hidden="true"
        strokeWidth={1.6}
        strokeLinecap="round"
      >
        {next === 'dark' ? (
          <>
            <path d="M18.4 13.6c-1.1 3.2-4.4 5.3-7.8 4.8-3.4-.5-5.9-3.4-6-6.8-.1-3.1 2-5.9 5-6.7-1 2.6-.4 5.6 1.6 7.5 2 1.9 5 2.4 7.2 1.2z" />
          </>
        ) : (
          <>
            <path d="M11 6.2c2.7-.1 4.9 2.1 4.8 4.8-.1 2.6-2.2 4.7-4.8 4.6-2.6-.1-4.7-2.2-4.6-4.8.1-2.5 2.1-4.5 4.6-4.6z" />
            <path d="M11 1.8v2.1M11 18.1v2.1M1.9 11h2.2M17.9 11h2.2M4.6 4.5l1.6 1.5M15.8 15.9l1.6 1.6M17.4 4.6l-1.5 1.5M6.1 15.9l-1.6 1.6" />
          </>
        )}
      </svg>
    </button>
  );
}
