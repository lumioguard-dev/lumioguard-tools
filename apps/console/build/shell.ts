import { EXAMPLES, HEADLINE_TEXT, LEADERBOARD, PUBLISHER, SCAN, beats } from '../src/copy.js';
import { CATALOGUE, type ConsolePage } from '../src/tools/catalogue.js';
import { escapeHtml } from './html.js';
import { CSS_HAND, CSS_INK_1, CSS_INK_3 } from './tokens.js';

const STYLE = [
  `.shell{max-width:64rem;margin:0 auto;padding:3rem 1.5rem;color:${CSS_INK_1};font-family:Archivo,system-ui,sans-serif;line-height:1.55}`,
  `.shell h1{font-family:Archivo,system-ui,sans-serif;font-size:2.25rem;line-height:1.12;color:${CSS_HAND};margin:0 0 1rem;max-width:20ch}`,
  `.shell h2{font-family:"Architects Daughter",cursive;font-size:1.25rem;font-weight:400;color:${CSS_INK_3};margin:2rem 0 .5rem}`,
  '.shell p{margin:0 0 1rem;max-width:62ch}',
  '.shell ul,.shell ol{margin:0;padding-left:1.25rem;max-width:62ch}',
  // The stylesheet this lands beside resets markers away, and a numbered step
  // that renders unnumbered has lost the thing making it a step.
  '.shell ul{list-style:disc}',
  '.shell ol{list-style:decimal}',
  '.shell li{margin:.35rem 0}',
  '.shell nav{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:.5rem}',
  `.shell a{color:${CSS_HAND}}`,
  `.shell footer{margin-top:2.5rem;color:${CSS_INK_3};font-size:.85rem}`,
].join('');

/**
 * The document served before any JavaScript runs. Empty, `#root` is `access.shell`;
 * text differing from the rendered page is `access.agent-thin`.
 */
export function staticShell(mount: string, page: ConsolePage = { kind: 'choose' }): string {
  const heading =
    page.kind === 'tool'
      ? page.tool.headline
      : page.kind === 'scan'
        ? SCAN.headline
        : page.kind === 'leaderboard'
          ? LEADERBOARD.headline
          : HEADLINE_TEXT;
  // The chooser is the one document a crawler reaches every reading from.
  const choices = CATALOGUE.map(
    (tool) =>
      `<li><a href="${mount}/${tool.slug}">${escapeHtml(tool.label)}</a>. ${escapeHtml(tool.summary)}</li>`,
  ).join('\n          ');

  const how = beats(page.kind === 'tool' ? page.tool.checks : undefined);
  const steps = [how.paste, how.read, how.result]
    .map((beat) => `<li>${escapeHtml(beat)}</li>`)
    .join('\n          ');

  // The addresses the app itself reads on load, so each works without the script,
  // and they are the only way out of this page.
  const examples = EXAMPLES.map(
    (site) => `<a href="${mount}/?site=${encodeURIComponent(site)}">Read ${escapeHtml(site)}</a>`,
  ).join('\n          ');

  return `
      <div class="shell">
        <style>${STYLE}</style>
        <h1>${escapeHtml(heading)}</h1>
${
  page.kind === 'choose'
    ? `
        <h2>What to read</h2>
        <ul>
          ${choices}
        </ul>
`
    : ''
}
        <h2>How it works</h2>
        <ol>
          ${steps}
        </ol>

        <h2>Try one</h2>
        <nav>
          ${examples}
        </nav>

        <footer>${escapeHtml(PUBLISHER)}</footer>
      </div>`;
}
