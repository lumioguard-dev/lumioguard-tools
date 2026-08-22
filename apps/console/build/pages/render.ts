import { NAME, PUBLISHER } from '../../src/copy.js';
import type { PageLink } from '../../src/pages.js';
import { headTags } from '../head.js';
import { escapeHtml } from '../html.js';
import type { Site } from '../site.js';
import { CONTENT_PAGES, type ContentPage, type Section, type Table } from './content.js';

/**
 * An explainer as a complete document, no React. A real file at a real path
 * rather than a route, so a static host never rewrites an unknown path.
 */

const STYLE = [
  ':root{color-scheme:light dark}',
  'body{margin:0;background:var(--paper-base,#f5f2e8)}',
  '.doc{max-width:44rem;margin:0 auto;padding:2.5rem 1.5rem 4rem;color:var(--ink-1,#151b28);font-family:Archivo,system-ui,sans-serif;font-size:1.02rem;line-height:1.62}',
  '.doc a{color:var(--hand,#2f4fb5)}',
  '.doc nav.top{display:flex;gap:1rem;font-family:"Architects Daughter",cursive;font-size:1.3rem;margin-bottom:2.5rem}',
  '.doc h1{font-family:"Architects Daughter",cursive;font-size:2.3rem;line-height:1.12;color:var(--hand,#2f4fb5);margin:0 0 1rem}',
  '.doc .lead{font-size:1.16rem;line-height:1.5;color:var(--ink-2,#414b63);margin:0 0 2.5rem}',
  '.doc h2{font-family:"Architects Daughter",cursive;font-size:1.5rem;font-weight:400;line-height:1.2;margin:2.75rem 0 .75rem;color:var(--ink-1,#151b28)}',
  '.doc p{margin:0 0 1rem}',
  '.doc ul{margin:0 0 1rem;padding-left:1.2rem}',
  '.doc li{margin:.4rem 0}',
  // Tables carry the published ladders and must not push the page sideways on
  // a phone, so the scroll is the table's own.
  '.doc .scroll{overflow-x:auto;margin:0 0 1.25rem}',
  '.doc table{border-collapse:collapse;width:100%;font-size:.95rem}',
  '.doc caption{text-align:left;font-family:"Architects Daughter",cursive;font-size:1.05rem;color:var(--ink-3,#545f78);padding-bottom:.4rem}',
  '.doc th,.doc td{text-align:left;padding:.5rem .75rem;border-bottom:1px solid var(--line-base,#dbe2f2);vertical-align:top}',
  '.doc th{font-weight:600;white-space:nowrap}',
  '.doc .cta{display:inline-block;margin:2.5rem 0 0;padding:.7rem 1.1rem;background:var(--hand,#2f4fb5);color:#fff;text-decoration:none;border-radius:3px 9px 4px 8px}',
  '.doc footer{margin-top:3.5rem;padding-top:1.25rem;border-top:1px solid var(--line-base,#dbe2f2);color:var(--ink-3,#545f78);font-size:.87rem}',
  '.doc footer nav{display:flex;flex-wrap:wrap;gap:.9rem;margin-bottom:.75rem}',
].join('');

function tableHtml(table: Table): string {
  const head = table.head.map((cell) => `<th scope="col">${escapeHtml(cell)}</th>`).join('');
  const rows = table.rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('\n            ');

  return `<div class="scroll">
          <table>
            <caption>${escapeHtml(table.caption)}</caption>
            <thead><tr>${head}</tr></thead>
            <tbody>
            ${rows}
            </tbody>
          </table>
        </div>`;
}

function sectionHtml(section: Section): string {
  const parts = [`<h2>${escapeHtml(section.heading)}</h2>`];
  if (section.table !== undefined) parts.push(tableHtml(section.table));
  for (const paragraph of section.body ?? []) parts.push(`<p>${escapeHtml(paragraph)}</p>`);
  if (section.list !== undefined) {
    const items = section.list.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n            ');
    parts.push(`<ul>\n            ${items}\n          </ul>`);
  }
  return parts.join('\n        ');
}

/** Every other explainer, so each page is reachable from every other one. */
function siblings(current: PageLink, mount: string): string {
  return CONTENT_PAGES.filter((page) => page.meta.path !== current.path)
    .map((page) => `<a href="${mount}${page.meta.path}">${escapeHtml(page.meta.title)}</a>`)
    .join('\n            ');
}

export function renderPage(page: ContentPage, where: Site | null, hasImage: boolean): string {
  const sections = page.sections.map(sectionHtml).join('\n\n        ');
  const mount = where?.path ?? '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${headTags(page.meta, where, hasImage)}
    <link rel="icon" href="${mount}/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <meta name="color-scheme" content="light dark" />
    <link
      href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&amp;family=Architects+Daughter&amp;display=swap"
      rel="stylesheet"
    />
    <style>${STYLE}</style>
  </head>
  <body>
    <main class="doc">
      <nav class="top"><a href="${mount}/">${escapeHtml(NAME.toLowerCase())}</a></nav>

      <h1>${escapeHtml(page.meta.title)}</h1>
      <p class="lead">${escapeHtml(page.lead)}</p>

      ${sections}

      <a class="cta" href="${mount}/">Read a site with ${escapeHtml(NAME)}</a>

      <footer>
        <nav>
          <a href="${mount}/">${escapeHtml(NAME)}</a>
          ${siblings(page.meta, mount)}
        </nav>
        ${escapeHtml(NAME)} by ${escapeHtml(PUBLISHER)}
      </footer>
    </main>
  </body>
</html>
`;
}
