type Rgb = readonly [number, number, number];

function parseHex(value: string): Rgb | null {
  const raw = value.replace('#', '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  if (full.length !== 6) return null;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance([r, g, b]: Rgb): number {
  const channel = (value: number): number => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((p, q) => q - p) as [
    number,
    number,
  ];
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Foreground/background pairs written in the SAME rule. Without computed styles
 * inheritance cannot be resolved, so this judges only colours declared together:
 * a floor on what a real browser would see, not a full audit.
 */
export function colorPairs(css: string): Array<readonly [Rgb, Rgb]> {
  const pairs: Array<readonly [Rgb, Rgb]> = [];
  for (const block of css.matchAll(/\{([^}]{0,400})\}/g)) {
    const body = block[1] ?? '';
    const fg = body.match(/(?:^|;)\s*color\s*:\s*(#[0-9a-f]{3,8})/i);
    const bg = body.match(/background(?:-color)?\s*:\s*(#[0-9a-f]{3,8})/i);
    if (fg === null || bg === null) continue;
    const foreground = parseHex(fg[1] ?? '');
    const background = parseHex(bg[1] ?? '');
    if (foreground !== null && background !== null) pairs.push([foreground, background]);
  }
  return pairs;
}
