/**
 * A block that will not parse is kept as an ERROR rather than dropped: invalid
 * JSON-LD is silently ignored by every consumer, which is exactly why the author
 * never finds out, and is worth a finding of its own.
 */

/** A node's shape as far as this needs it: a bag of unknown values. */
export type LdNode = Readonly<Record<string, unknown>>;

export interface LdRead {
  readonly nodes: readonly LdNode[];
  /** One entry per block that failed to parse, with the parser's complaint. */
  readonly invalid: readonly string[];
  readonly blockCount: number;
}

function isNode(value: unknown): value is LdNode {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Every node in a block, with `@graph`, arrays and NESTED nodes flattened out.
 * An entity is usually published inside the thing it belongs to: descending only
 * into `@graph` reported the most-cited page on the web as naming no publisher.
 */
function collect(value: unknown, into: LdNode[], depth = 0): void {
  if (depth > 6) return;
  if (Array.isArray(value)) {
    for (const item of value) collect(item, into, depth + 1);
    return;
  }
  if (!isNode(value)) return;

  into.push(value);
  for (const [key, nested] of Object.entries(value)) {
    // `@context` is vocabulary, not content, and descending it yields nodes
    // that describe the schema rather than the page.
    if (key === '@context') continue;
    if (Array.isArray(nested) || isNode(nested)) collect(nested, into, depth + 1);
  }
}

export function readJsonLd(blocks: readonly string[]): LdRead {
  const nodes: LdNode[] = [];
  const invalid: string[] = [];

  for (const block of blocks) {
    try {
      collect(JSON.parse(block), nodes);
    } catch (error) {
      invalid.push(error instanceof Error ? error.message : 'Could not be parsed');
    }
  }

  return { nodes, invalid, blockCount: blocks.length };
}

/** `@type` is a string or a list of them; both arrive here as a list. */
export function typesOf(node: LdNode): string[] {
  const raw = node['@type'];
  if (typeof raw === 'string') return [raw];
  if (Array.isArray(raw)) return raw.filter((item): item is string => typeof item === 'string');
  return [];
}

export function hasType(node: LdNode, ...types: readonly string[]): boolean {
  const found = typesOf(node).map((type) => type.toLowerCase());
  return types.some((type) => found.includes(type.toLowerCase()));
}

/** A property as a string, whether it was written flat or as a nested node. */
export function stringField(node: LdNode, field: string): string | null {
  const value = node[field];
  if (typeof value === 'string' && value.trim() !== '') return value.trim();
  if (isNode(value)) {
    const name = value.name;
    if (typeof name === 'string' && name.trim() !== '') return name.trim();
  }
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === 'string' && item.trim() !== '');
    if (typeof first === 'string') return first.trim();
  }
  return null;
}

export function listField(node: LdNode, field: string): string[] {
  const value = node[field];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  return [];
}

/** The node a page is mainly about: the first that is not site-level furniture. */
const FURNITURE = ['website', 'webpage', 'breadcrumblist', 'collectionpage', 'itemlist'];

export function primaryNode(nodes: readonly LdNode[]): LdNode | null {
  const substantive = nodes.find((node) => {
    const types = typesOf(node).map((type) => type.toLowerCase());
    return types.length > 0 && !types.every((type) => FURNITURE.includes(type));
  });
  return substantive ?? nodes[0] ?? null;
}
