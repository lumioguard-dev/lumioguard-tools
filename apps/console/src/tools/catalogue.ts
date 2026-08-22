/**
 * What each reading is called and what it does, as plain data.
 *
 * Split out of the descriptors so the BUILD can read it: a descriptor is a
 * `.tsx` pulling in React and the UI package, and the Vite config runs in Node
 * before any of that exists. The descriptors spread their entry from here, so
 * the words cannot drift; `catalogue.test.ts` holds the order to the registry.
 */
export interface ToolCopy {
  /** Stable, lower-case, and the segment its dev proxy is mounted at. */
  readonly id: string;
  /**
   * What this reading IS, never what built it. A visitor picking what to read
   * is choosing between concerns, not between Slopmeter, Leakpeek and Citecheck.
   */
  readonly label: string;
  /** What this tool does, in ONE sentence. It is a tooltip, not a paragraph. */
  readonly summary: string;
}

/** Slopmeter first: it is the one a visitor arrives wanting. */
export const CATALOGUE: readonly ToolCopy[] = [
  {
    id: 'slopmeter',
    label: 'AI slop',
    summary: 'Scores how much of the site came out of a template rather than a decision.',
  },
  {
    id: 'leakpeek',
    label: 'Security',
    summary: 'Reports what the site is exposing to anyone with the URL.',
  },
  {
    id: 'citecheck',
    label: 'SEO & AI visibility',
    summary: 'Reports what stops an answer engine reading the site and quoting it.',
  },
];

/** The entry for one tool, or a throw: a descriptor naming nothing is a defect. */
export function toolCopy(id: string): ToolCopy {
  const found = CATALOGUE.find((tool) => tool.id === id);
  if (found === undefined) throw new Error(`No catalogue entry for tool "${id}"`);
  return found;
}
