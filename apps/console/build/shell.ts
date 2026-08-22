import {
  DESCRIPTION,
  EXAMPLES,
  HEADLINE_TEXT,
  HOW_IT_WORKS,
  NAME,
  PUBLISHER,
} from '../src/copy.js';
import { PAGES } from '../src/pages.js';
import { CATALOGUE } from '../src/tools/catalogue.js';
import { escapeHtml } from './html.js';

/** Scoped to the shell, and thrown away with it. */
const STYLE = [
  '.shell{max-width:64rem;margin:0 auto;padding:3rem 1.5rem;color:var(--ink-1,#151b28);font-family:Archivo,system-ui,sans-serif;line-height:1.55}',
  '.shell h1{font-family:"Architects Daughter",cursive;font-size:2.25rem;line-height:1.12;color:var(--hand,#2f4fb5);margin:0 0 1rem;max-width:20ch}',
  '.shell h2{font-family:"Architects Daughter",cursive;font-size:1.25rem;font-weight:400;color:var(--ink-3,#545f78);margin:2rem 0 .5rem}',
  '.shell p{margin:0 0 1rem;max-width:62ch}',
  '.shell ul,.shell ol{margin:0;padding-left:1.25rem;max-width:62ch}',
  // The stylesheet this lands beside resets markers away, and a numbered step
  // that renders unnumbered has lost the thing making it a step.
  '.shell ul{list-style:disc}',
  '.shell ol{list-style:decimal}',
  '.shell li{margin:.35rem 0}',
  '.shell nav{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:.5rem}',
  '.shell a{color:var(--hand,#2f4fb5)}',
  '.shell footer{margin-top:2.5rem;color:var(--ink-3,#545f78);font-size:.85rem}',
].join('');

/**
 * The document served before any JavaScript runs. Empty, `#root` is
 * `access.shell`, a blocker. Every word is imported, because served text that
 * differs from the rendered page is `access.agent-thin`.
 */
/**
 * `mount` is where the app is served from, empty at a host root. Every link
 * here is written with it, so the same build works at `/` and at `/tools`.
 */
export function staticShell(mount: string): string {
  const tools = CATALOGUE.map(
    (tool) => `<li><b>${escapeHtml(tool.label)}.</b> ${escapeHtml(tool.summary)}</li>`,
  ).join('\n          ');

  const beats = [HOW_IT_WORKS.paste, HOW_IT_WORKS.read, HOW_IT_WORKS.result]
    .map((beat) => `<li>${escapeHtml(beat)}</li>`)
    .join('\n          ');

  // The addresses the app itself reads on load, so each works whether or not
  // the script arrives, and they are the only way out of this page.
  const examples = EXAMPLES.map(
    (site) => `<a href="${mount}/?site=${encodeURIComponent(site)}">Read ${escapeHtml(site)}</a>`,
  ).join('\n          ');

  const reading = PAGES.map(
    (page) => `<li><a href="${mount}${page.path}">${escapeHtml(page.title)}</a></li>`,
  ).join('\n          ');

  return `
      <div class="shell">
        <style>${STYLE}</style>
        <h1>${escapeHtml(HEADLINE_TEXT)}</h1>
        <p>${escapeHtml(DESCRIPTION)}</p>

        <h2>What to read</h2>
        <ul>
          ${tools}
        </ul>

        <h2>How it works</h2>
        <ol>
          ${beats}
        </ol>

        <h2>Try one</h2>
        <nav>
          ${examples}
        </nav>

        <h2>How it is measured</h2>
        <ul>
          ${reading}
        </ul>

        <footer>${escapeHtml(NAME)} by ${escapeHtml(PUBLISHER)}</footer>
      </div>`;
}
