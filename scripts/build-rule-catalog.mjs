/**
 * Writes .documentation/RULES.md from the rule sources themselves: hand-listing
 * every check across three engines is a list that is wrong by the next commit.
 * `pnpm rules:check` fails when the committed file stops matching them.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, '.documentation', 'RULES.md');
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

/** `category: RuleCategory.Voice` reads as `Voice`. */
function member(block, name) {
  const at = block.indexOf(`${name}:`);
  if (at === -1) return null;
  const rest = block.slice(at + name.length + 1).trimStart();
  if (rest[0] === "'" || rest[0] === '"' || rest[0] === '`') return str(block, name);
  const token = rest.split(',')[0].split('\n')[0].trim();
  const dot = token.lastIndexOf('.');
  return (dot === -1 ? token : token.slice(dot + 1)) || null;
}

/** The `[...]` a named declaration is built from, as its raw text. */
function listBody(path, name) {
  const source = read(join(ROOT, path));
  const at = source.indexOf(name);
  if (at === -1) return '';
  const open = source.indexOf('[', at);
  const close = source.indexOf('])', open);
  return open === -1 || close === -1 ? '' : source.slice(open, close);
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
          detail: str(block, 'detail'),
          group: groupKey ? member(block, groupKey) : null,
          weight: weightKey ? num(block, weightKey) : null,
        });
      }
    }
  }
  return out;
}

const AXIS_POLICY = 'tools/slopmeter/core/src/rules/AxisPolicy.ts';
const RULE_CATEGORY = 'tools/slopmeter/core/src/domain/RuleCategory.ts';

/**
 * `AxisPolicy` decides what a slop rule may do to a score, so the grouping below
 * reads its sets rather than restating them. `Unassessable` is left out: it needs
 * an option the Worker never passes, so no published scan produces one.
 */
const quoted = (body) => new Set([...body.matchAll(/'([^']+)'/g)].map((match) => match[1]));

const UNSCORED_RULES = new Set([
  ...quoted(listBody(AXIS_POLICY, 'QUALITY_AXIS_RULES')),
  ...quoted(listBody(AXIS_POLICY, 'INFORMATIONAL_RULES')),
]);

const UNSCORED_CATEGORIES = new Set(
  [...listBody(RULE_CATEGORY, 'PROVENANCE_CATEGORIES').matchAll(/RuleCategory\.(\w+)/g)].map(
    (match) => match[1],
  ),
);

function slopGroup(rule) {
  if (UNSCORED_RULES.has(rule.id) || UNSCORED_CATEGORIES.has(rule.group)) return 'unscored';
  return (rule.weight ?? 0) < 0 ? 'credit' : 'penalty';
}

const SLOP_GROUPS = [
  {
    key: 'penalty',
    heading: 'Costs points',
    note: 'Each of these subtracts its weight from 100.',
  },
  {
    key: 'credit',
    heading: 'Earns points back',
    note: 'Evidence of deliberate work. Together these can return at most half of what the penalties took.',
  },
  {
    key: 'unscored',
    heading: 'Reported, never scored',
    note: 'Shown with the rest of the evidence and worth zero: real defects the report should still name, tells measured to fire more on hand-built pages than generated ones, and where the site was deployed.',
  },
];

/**
 * `name` is what the site's Tools menu calls each one, so a reader arriving from
 * lumioguard.dev finds the same word here. The engine folder keeps its own name.
 */
const TOOLS = [
  {
    name: 'AI slop',
    slug: 'slopmeter',
    path: '/tools/ai-slop-check',
    groups: SLOP_GROUPS,
    groupOf: slopGroup,
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
    name: 'Security',
    slug: 'leakpeek',
    path: '/tools/security-check',
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
    name: 'SEO & AI visibility',
    slug: 'citecheck',
    path: '/tools/seo-ai-visibility-check',
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
      null,
      null,
    ),
  },
];

/**
 * One line per check, in plain words, with nothing repeated. A title that
 * interpolates a count reads as "has … … a crawler cannot read" once the hole
 * is empty, so those fall back to the first sentence of the finding's detail.
 */
function lines(tool) {
  const seen = new Set();
  const out = [];
  for (const rule of tool.rules) {
    let text = rule.title;
    if (text?.includes(ELLIPSIS)) {
      let sentence = rule.detail?.split('. ')[0]?.trim().replace(/\.$/, '');
      // Its opening clause, so one fallback does not run four times the length
      // of the labels around it.
      if (sentence) {
        const cut = [': ', ', so ', ', and ', ', which ', ', '].reduce((best, mark) => {
          const at = sentence.indexOf(mark);
          return at >= 30 && at < best ? at : best;
        }, sentence.length);
        sentence = sentence.slice(0, cut).trim();
      }
      text = sentence && !sentence.includes(ELLIPSIS) ? sentence : null;
    }
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    out.push({ text, group: tool.groupOf ? tool.groupOf(rule) : null });
  }
  return out;
}

/** A group with nothing in it is dropped, so an emptied set stops appearing here. */
function grouped(tool, items) {
  if (!tool.groups) return [...items.map((item) => `- ${item.text}`), ''];
  return tool.groups.flatMap((group) => {
    const texts = items.filter((item) => item.group === group.key).map((item) => item.text);
    if (texts.length === 0) return [];
    return [
      `### ${group.heading} (${texts.length})`,
      '',
      group.note,
      '',
      ...texts.map((text) => `- ${text}`),
      '',
    ];
  });
}

const sections = TOOLS.map((tool) => {
  const items = lines(tool);
  return { tool, count: items.length, items };
});

const doc = [
  '# What each tool checks',
  '',
  'Every check the three tools run, in plain words.',
  '',
  'Generated from the rule sources by `scripts/build-rule-catalog.mjs`. Do not edit',
  'it by hand: run `pnpm rules` after changing a rule, and `pnpm rules:check` fails',
  'when this file and the engines disagree.',
  '',
  ...sections.flatMap((s) => [
    `## ${s.tool.name}`,
    '',
    // Things looked for, not rules: two rules can look for the same thing and
    // are one line here, which is what a reader sees in the report too.
    `${s.count} things it looks for, at [\`${s.tool.path}\`](https://lumioguard.dev${s.tool.path}). What they mean and how they score is in [\`tools/${s.tool.slug}/README.md\`](../tools/${s.tool.slug}/README.md).`,
    '',
    ...grouped(s.tool, s.items),
  ]),
].join('\n');

mkdirSync(dirname(OUT), { recursive: true });
if (process.argv.includes('--check')) {
  const current = existsSync(OUT) ? read(OUT) : '';
  if (current !== doc) {
    console.error('.documentation/RULES.md is out of date. Run `pnpm rules`.');
    process.exit(1);
  }
  console.log('.documentation/RULES.md matches the rule sources.');
} else {
  writeFileSync(OUT, doc, 'utf8');
  console.log(sections.map((s) => `${s.tool.name}: ${s.count}`).join(', '));
}
