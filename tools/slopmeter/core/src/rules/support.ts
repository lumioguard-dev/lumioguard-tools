/** Shared helpers for rule predicates. */

export function distinctHits(haystack: string, terms: readonly string[]): string[] {
  return terms.filter((term) => haystack.includes(term));
}

export function countMatches(input: string, pattern: RegExp): number {
  return (input.match(pattern) ?? []).length;
}

/** Evidence when a rule fires, `null` when it does not. */
export function evidence(condition: boolean, proof: string): string | null {
  return condition ? proof : null;
}

export function firstMatch(input: string, pattern: RegExp): string | null {
  return input.match(pattern)?.[0] ?? null;
}

/** "1 pulsing dot", not "1 pulsing dots". */
export function plural(count: number, singular: string, pluralForm?: string): string {
  return `${count} ${count === 1 ? singular : (pluralForm ?? `${singular}s`)}`;
}
