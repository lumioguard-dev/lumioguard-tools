import { describe, expect, it } from 'vitest';
import { DESCRIPTION, NAME, TITLE } from '../../src/copy.js';
import { CATALOGUE } from '../../src/tools/catalogue.js';
import { HOME, headTags } from '../head.js';

const ORIGIN = 'https://example.test';

describe('headTags', () => {
  it('writes nothing absolute without an origin', () => {
    // A wrong canonical hands the page's standing to another address, so the
    // absent case writes none of it rather than guessing.
    const tags = headTags(HOME, null, true);
    expect(tags).not.toContain('rel="canonical"');
    expect(tags).not.toContain('og:url');
    expect(tags).not.toContain('ld+json');
  });

  it('still says what the page is without an origin', () => {
    const tags = headTags(HOME, null, false);
    expect(tags).toContain(`<title>${TITLE}</title>`);
    expect(tags).toContain(DESCRIPTION);
    expect(tags).toContain('og:title');
  });

  it('points the canonical at the home document, not at whatever ?site= is set', () => {
    expect(headTags(HOME, ORIGIN, true)).toContain(`<link rel="canonical" href="${ORIGIN}/" />`);
  });

  it('drops every image tag together when there is no image', () => {
    const tags = headTags(HOME, ORIGIN, false);
    expect(tags).not.toContain('og:image');
    expect(tags).not.toContain('twitter:image');
    // Claiming the large card with no picture renders an empty box.
    expect(tags).toContain('name="twitter:card" content="summary"');
  });
});

describe('the structured data', () => {
  const block = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(
    headTags(HOME, ORIGIN, true),
  );
  const graph = JSON.parse((block?.[1] ?? '{}').replace(/\\u003c/g, '<')) as {
    readonly '@graph': readonly { readonly '@type': string; readonly featureList?: string[] }[];
  };

  it('parses, which is the whole of what a consumer checks', () => {
    // `structured.invalid` is major precisely because nothing reports a block
    // it could not read: the markup looks present and counts for nothing.
    expect(graph['@graph'].length).toBeGreaterThan(0);
  });

  it('names who publishes this', () => {
    // `structured.no-entity`: an engine has to resolve who a page is about
    // before it can attribute anything to them.
    expect(graph['@graph'].map((node) => node['@type'])).toContain('Organization');
  });

  it('lists the readings from the catalogue rather than a copy of it', () => {
    const app = graph['@graph'].find((node) => node['@type'] === 'WebApplication');
    expect(app?.featureList).toHaveLength(CATALOGUE.length);
    for (const tool of CATALOGUE) {
      expect(app?.featureList?.join(' ')).toContain(tool.label);
    }
  });

  it('escapes the one character that would close the script early', () => {
    expect(block?.[1]).not.toContain('<');
  });
});

describe('the copy the head is built from', () => {
  it('keeps the description inside what a search result will show', () => {
    // Citecheck's own floor is 25 characters and nothing here approaches it.
    // The ceiling is the one that bites, and it is a truncated snippet rather
    // than a finding anywhere.
    expect(DESCRIPTION.length).toBeLessThanOrEqual(160);
  });

  it('keeps the title inside what a search result will show', () => {
    // `document.long-title` fires past 75, set where there is no width at
    // which a title still fits.
    expect(TITLE.length).toBeLessThanOrEqual(75);
  });

  it('names the app in its own title', () => {
    expect(TITLE).toContain(NAME);
  });
});
