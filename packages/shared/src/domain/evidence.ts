/**
 * A score subtracts from 100, so a crawl that reached almost nothing keeps
 * almost all of it: thin evidence can only inflate a reading, never deflate
 * one. Below this floor the number is reported, the tier is not trusted.
 */
export const EVIDENCE_FLOOR_PAGES = 3;

export const ReadingConfidence = {
  Provisional: 'provisional',
  Measured: 'measured',
} as const;

export type ReadingConfidence = (typeof ReadingConfidence)[keyof typeof ReadingConfidence];

export const READING_CONFIDENCE_NAMES: readonly ReadingConfidence[] = Object.freeze([
  ReadingConfidence.Provisional,
  ReadingConfidence.Measured,
]);

export function confidenceFor(pagesScanned: number): ReadingConfidence {
  return pagesScanned < EVIDENCE_FLOOR_PAGES
    ? ReadingConfidence.Provisional
    : ReadingConfidence.Measured;
}

/**
 * What the reader is told instead of a tier they cannot rely on. Takes the
 * confidence the wire carries rather than re-deriving it, so the floor stays
 * the scorer's alone.
 */
export function confidenceNote(confidence: ReadingConfidence, pagesScanned: number): string | null {
  if (confidence === ReadingConfidence.Measured) return null;
  const pages = pagesScanned === 1 ? 'one page' : `${pagesScanned} pages`;
  return `Read from ${pages}. Too little of the site was reachable to place it in a band.`;
}
