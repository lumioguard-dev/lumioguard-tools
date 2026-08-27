import { describe, expect, it } from 'vitest';
import { scrubProperties, withoutQuery } from '../redact.js';

// The hand-off carries the reading's site keys in its query, and those are
// handles to somebody's report.
describe('withoutQuery', () => {
  it('drops the query and keeps the rest', () => {
    expect(withoutQuery('https://app.lumioguard.dev/?sitekey=YKMEBQ_S7DK8P')).toBe(
      'https://app.lumioguard.dev/',
    );
    expect(withoutQuery('https://app.lumioguard.dev/audit?sitekey=YKMEBQ#top')).toBe(
      'https://app.lumioguard.dev/audit',
    );
  });

  it('hands back anything it cannot read as an address', () => {
    expect(withoutQuery('not a url')).toBe('not a url');
  });
});

// PostHog collects $current_url without being asked, and this console carries
// the site being read in the query. That address is somebody else's.
describe('scrubProperties', () => {
  it('strips the named parameter from every URL it finds', () => {
    expect(
      scrubProperties(
        {
          $current_url: 'https://lumioguard.dev/tools/?site=example.com&tools=leakpeek',
          $referrer: 'https://lumioguard.dev/tools/scan?site=example.com',
        },
        ['site'],
      ),
    ).toEqual({
      $current_url: 'https://lumioguard.dev/tools/?tools=leakpeek',
      $referrer: 'https://lumioguard.dev/tools/scan',
    });
  });

  it('leaves everything that is not a URL alone', () => {
    const properties = { $pathname: '/tools/scan', score: 41, tools: 'leakpeek,citecheck' };
    expect(scrubProperties(properties, ['site'])).toEqual(properties);
  });

  // Rewriting one it had no objection to would still change it: a bare origin
  // comes back from the parser with a slash it was not sent with.
  it('passes a URL carrying none of the parameters through as it was written', () => {
    const properties = {
      $current_url: 'https://lumioguard.dev',
      $referrer: 'https://lumioguard.dev/tools/?tools=leakpeek',
    };
    expect(scrubProperties(properties, ['site'])).toEqual(properties);
  });

  it('leaves the properties untouched when there is nothing to strip', () => {
    const properties = { $current_url: 'https://lumioguard.dev/tools/?site=example.com' };
    expect(scrubProperties(properties, [])).toBe(properties);
  });
});
