/**
 * Writes docs/RULES.md from the rule sources themselves.
 *
 * Hand-listing ~180 checks across three engines is a list that is wrong by the
 * next commit, so this reads the definitions instead. `pnpm rules:check` fails
 * when the committed file stops matching them.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'RULES.md');
const ELLIPSIS = String.fromCharCode(8230);

const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

/**
 * The string value of `name:` in a block, or null. All three quote styles,
 * because some titles are template literals: their holes stand for a count the
 * finding fills in, and read here as an ellipsis.
 */
function str(block, name) {
  const at = block.indexOf(`${name}:`);
  if (at === -1) return null;
  let rest = block.slice(at + name.length + 1).trimStart();

  // A ternary picks its wording at runtime. Take the first branch, which is the
  // representative line, rather than leaving the cell empty.
  if (!'\'"`'.includes(rest[0])) {
    const field = rest.search(/\n\s*[a-zA-Z]+:/);
    const window = field === -1 ? rest.slice(0, 300) : rest.slice(0, field);
    const opens = window.search(/['"`]/);
    if (opens === -1) return null;
    rest = window.slice(opens);
  }

  const quote = rest[0];
  if (quote !== "'" && quote !== '"' && quote !== '`') return null;

  let out = '';
  for (let i = 1; i < rest.length; i++) {
    const ch = rest[i];
    if (ch === '\\') {
      out += rest[i + 1] ?? '';
      i++;
      continue;
    }
    if (ch === quote) break;
    out += ch;
  }

  let text = out
    .split('\n')
    .map((line) => line.trim())
    .join(' ')
    .trim();
  for (;;) {
    const open = text.indexOf('${');
    if (open === -1) break;
    const close = text.indexOf('}', open);
    if (close === -1) break;
    text = text.slice(0, open) + ELLIPSIS + text.slice(close + 1);
  }
  return text || null;
}

/** The first of `names` that yields a string: engines name the human line differently. */
function firstStr(block, names) {
  for (const name of names) {
    const value = str(block, name);
    if (value) return value;
  }
  return null;
}

/** The numeric value of `name:`, or null. */
function num(block, name) {
  const at = block.indexOf(`${name}:`);
  if (at === -1) return null;
  const token = block
    .slice(at + name.length + 1, at + name.length + 12)
    .trim()
    .split(',')[0]
    .trim();
  return /^-?[0-9]+$/.test(token) ? Number(token) : null;
}

/** `category: RuleCategory.Copy` reads as `Copy`. */
function member(block, name) {
  const at = block.indexOf(`${name}:`);
  if (at === -1) return null;
  const rest = block.slice(at + name.length + 1).trimStart();
  if (rest[0] === "'" || rest[0] === '"' || rest[0] === '`') return str(block, name);
  const token = rest.split(',')[0].split('\n')[0].trim();
  const dot = token.lastIndexOf('.');
  return (dot === -1 ? token : token.slice(dot + 1)) || null;
}

function filesUnder(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : filesUnder(path);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [path] : [];
  });
}

/** Each `marker` occurrence, as the text from it up to the next one. */
function blocks(source, marker) {
  return source
    .split(marker)
    .slice(1)
    .map((part) => marker + part.slice(0, 600));
}

function collect(dirs, marker, idKey, titleKeys, groupKey, weightKey) {
  const out = [];
  for (const dir of dirs) {
    for (const file of filesUnder(join(ROOT, dir))) {
      for (const block of blocks(read(file), marker)) {
        const id = str(block, idKey);
        if (!id) continue;
        out.push({
          id,
          title: firstStr(block, titleKeys),
          group: groupKey ? member(block, groupKey) : null,
          weight: weightKey ? num(block, weightKey) : null,
        });
      }
    }
  }
  return out;
}

const TOOLS = [
  {
    name: 'Slopmeter',
    slug: 'slopmeter',
    groupLabel: 'Category',
    weighted: true,
    rules: collect(
      ['tools/slopmeter/core/src/rules/definitions'],
      'defineRule({',
      'id',
      ['label'],
      'category',
      'weight',
    ),
  },
  {
    name: 'Leakpeek',
    slug: 'leakpeek',
    groupLabel: null,
    weighted: false,
    rules: collect(
      ['tools/leakpeek/core/src/passive', 'tools/leakpeek/core/src/probes'],
      "code: '",
      'code',
      ['title', 'label'],
      null,
      null,
    ),
  },
  {
    name: 'Citecheck',
    slug: 'citecheck',
    groupLabel: 'Area',
    weighted: false,
    rules: collect(
      [
        'tools/citecheck/core/src/access',
        'tools/citecheck/core/src/answer',
        'tools/citecheck/core/src/document',
        'tools/citecheck/core/src/structured',
      ],
      "code: '",
      'code',
      ['title', 'label'],
      'area',
      null,
    ),
  },
];

function table(tool) {
  const uniq = [...new Map(tool.rules.map((rule) => [rule.id, rule])).values()].sort(
    (a, b) => (a.group ?? '').localeCompare(b.group ?? '') || a.id.localeCompare(b.id),
  );
  const head = ['Id', tool.groupLabel, tool.weighted ? 'Weight' : null, 'What it looks for'].filter(
    Boolean,
  );
  const rows = uniq.map((rule) => {
    const cells = [
      `\`${rule.id}\``,
      tool.groupLabel ? (rule.group ?? '-') : null,
      tool.weighted ? String(rule.weight ?? '-') : null,
      (rule.title ?? '-').split('|').join('\\|'),
    ].filter((cell) => cell !== null);
    return `| ${cells.join(' | ')} |`;
  });
  const separator = `|${head.map(() => '---').join('|')}|`;
  return { count: uniq.length, md: [`| ${head.join(' | ')} |`, separator, ...rows].join('\n') };
}

const sections = TOOLS.map((tool) => ({ tool, ...table(tool) }));

const doc = [
  '# What each tool looks for',
  '',
  'Generated from the rule sources by `scripts/build-rule-catalog.mjs`. Do not edit',
  'it by hand: run `pnpm rules` after changing a rule, and `pnpm rules:check` fails',
  'when this file and the engines disagree.',
  '',
  "Every tool's own `README.md` is still the authority on what it does and what it",
  'refuses to do. This is the index: the identifiers, and one line each.',
  '',
  '**These identifiers are internal.** They are readable here because the engines',
  'are open source, and they still never cross the wire: no route returns a rule',
  'id, a category or the catalogue, and `api/__tests__/wire-boundary.test.ts` fails',
  'if one starts to. A reader is shown a tell in its own words and the evidence for',
  'it, never the identifier that produced it.',
  '',
  '| Tool | Checks | Engine |',
  '|---|---|---|',
  ...sections.map(
    (s) => `| [${s.tool.name}](#${s.tool.slug}) | ${s.count} | \`tools/${s.tool.slug}/core\` |`,
  ),
  '',
  ...sections.flatMap((s) => [
    `<a id="${s.tool.slug}"></a>`,
    '',
    `## ${s.tool.name}`,
    '',
    `${s.count} checks. See [\`tools/${s.tool.slug}/README.md\`](../tools/${s.tool.slug}/README.md) for what they mean and how they score.`,
    '',
    s.md,
    '',
  ]),
].join('\n');

mkdirSync(dirname(OUT), { recursive: true });
if (process.argv.includes('--check')) {
  const current = existsSync(OUT) ? read(OUT) : '';
  if (current !== doc) {
    console.error('docs/RULES.md is out of date. Run `pnpm rules`.');
    process.exit(1);
  }
  console.log('docs/RULES.md matches the rule sources.');
} else {
  writeFileSync(OUT, doc, 'utf8');
  console.log(sections.map((s) => `${s.tool.name}: ${s.count}`).join(', '));
}
