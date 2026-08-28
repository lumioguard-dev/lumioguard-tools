/**
 * Shared because both engines had a copy and the tables drifted: one decoded
 * `&mdash;` to a colon and a space, destroying the em dash before the rule that
 * scores its density could see it. The other spelled it a comma and a space.
 */

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  copy: '©',
  reg: '®',
  trade: '™',
};

function safeChar(code: number): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return '';
  try {
    return String.fromCodePoint(code);
  } catch {
    return '';
  }
}

/**
 * `overrides` is where a tool states the entries it deliberately reads
 * differently, so a divergence is a line of code rather than a second table
 * nobody can diff against the first.
 */
export function decodeEntities(
  input: string,
  overrides: Readonly<Record<string, string>> = {},
): string {
  const table = { ...NAMED_ENTITIES, ...overrides };
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => safeChar(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => safeChar(Number.parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (match, name: string) => table[name.toLowerCase()] ?? match);
}
