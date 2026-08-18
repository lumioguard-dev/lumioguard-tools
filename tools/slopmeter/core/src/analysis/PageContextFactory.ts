import type { PageSnapshot } from '../domain/PageSnapshot.js';
import { HtmlDocument } from './HtmlDocument.js';
import { AnalysisLimits } from './Limits.js';
import { type PageContext, PageContextImpl } from './PageContext.js';
import { StyleSheets } from './StyleSheets.js';
import { TextContent } from './TextContent.js';

export class PageContextFactory {
  public create(snapshot: PageSnapshot): PageContext {
    const raw = snapshot.html;
    const wasTruncated = raw.length > AnalysisLimits.maxHtmlBytes;
    const html = wasTruncated ? raw.slice(0, AnalysisLimits.maxHtmlBytes) : raw;

    let url: URL | null = null;
    try {
      if (snapshot.url !== null) url = new URL(snapshot.url);
    } catch {
      url = null;
    }

    return new PageContextImpl({
      url,
      host: url?.hostname.toLowerCase() ?? '',
      html,
      rawByteLength: raw.length,
      wasTruncated,
      headers: snapshot.headers,
      document: HtmlDocument.from(html, url),
      styles: StyleSheets.from(html, snapshot.stylesheets),
      content: TextContent.from(html, raw.length),
    });
  }
}
