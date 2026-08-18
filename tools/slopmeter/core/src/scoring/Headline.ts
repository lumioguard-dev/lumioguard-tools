import type { Finding } from '../domain/Finding.js';

/** Anything carrying a weight and a phrase: a page finding or a site signal. */
export interface Tellable {
  readonly weight: number;
  readonly phrase: string | null;
}

/** How many tells one sentence can carry before it stops being quotable. */
const NAMED = 3;

function asList(items: readonly string[]): string {
  if (items.length === 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

/** The one line a reader would repeat, composed from the three heaviest tells. */
export function headlineFrom(tells: readonly Tellable[]): string | null {
  const phrases = tells
    .filter((tell) => tell.weight > 0 && tell.phrase !== null)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, NAMED)
    .map((tell) => tell.phrase as string);

  return phrases.length === 0 ? null : `Mostly ${asList(phrases)}.`;
}

export function headlineFor(findings: readonly Finding[]): string | null {
  return headlineFrom(findings.filter((finding) => finding.isPenalty));
}
