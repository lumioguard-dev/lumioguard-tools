import { describe, expect, it } from 'vitest';
import { SlopAnalyzer } from '../SlopAnalyzer.js';
import { PageSnapshot } from '../domain/PageSnapshot.js';
import { QUALITY_AXIS_RULES } from '../rules/AxisPolicy.js';
import { createDefaultRegistry } from '../rules/definitions/index.js';

const analyzer = new SlopAnalyzer(createDefaultRegistry());

const analyze = (html: string, options: { url?: string; css?: string[] } = {}) =>
  analyzer.analyze(
    PageSnapshot.create({
      url: options.url ?? 'https://northwind.test/',
      html,
      stylesheets: options.css ?? [],
    }),
  );

const page = (body: string, style = ''): string =>
  `<!doctype html><html lang="en"><head><title>Northwind Trading</title>
   <meta name="viewport" content="width=device-width">
   <meta name="description" content="Importers of dried goods since 1994.">
   <link rel="canonical" href="https://northwind.test/">
   <link rel="icon" href="/favicon.svg">
   <style>${style}</style></head><body>${body}</body></html>`;

const ruleIds = (findings: readonly { ruleId: string }[]): Set<string> =>
  new Set(findings.map((f) => f.ruleId));

describe('scoring', () => {
  it('caps craft credit at half the penalty total', () => {
    const result = analyze(page('<h1>Northwind</h1>'));
    expect(result.score.creditApplied).toBeLessThanOrEqual(result.score.creditCap);
    expect(result.score.value).toBeGreaterThanOrEqual(0);
  });

  it('never returns a score outside 0-100', () => {
    const slop = analyze(
      page(
        `<h1>Lorem ipsum dolor sit amet</h1>
         <p>Your Company will seamlessly empower effortless, cutting-edge growth.</p>
         <p>As an AI language model, I cannot browse the web.</p>`,
      ),
    );
    expect(slop.score.value).toBeGreaterThanOrEqual(0);
    expect(slop.score.value).toBeLessThanOrEqual(100);
  });
});

describe('alignment: the tool is not the offence', () => {
  const CLEAN = page(
    `<h1>Northwind Trading</h1>${'<p>We have imported dried goods since 1994.</p>'.repeat(20)}`,
  );

  it('building with an AI tool does not raise the score', () => {
    const plain = analyze(CLEAN);
    const toolBuilt = analyze(CLEAN.replace('<body>', '<body data-lov-id="x">'), {
      url: 'https://northwind.lovable.app/',
    });

    expect(toolBuilt.score.value).toBe(plain.score.value);
    expect(ruleIds(toolBuilt.provenanceFindings).has('fingerprint.lovable')).toBe(true);
    expect(ruleIds(toolBuilt.findings).has('fingerprint.lovable')).toBe(false);
  });

  it('reports what built the page without scoring it', () => {
    const result = analyze(
      CLEAN.replace('</head>', '<meta name="generator" content="v0.dev"></head>'),
    );
    expect(ruleIds(result.provenanceFindings).has('fingerprint.v0')).toBe(true);
    for (const finding of result.provenanceFindings) {
      expect(finding.isScored).toBe(false);
    }
  });
});

describe('leftovers', () => {
  it('fires on a page of stock defaults', () => {
    const result = analyze(
      page(`<h1>Lorem ipsum dolor sit amet</h1>
        <p>As an AI language model, I cannot browse the web.</p>
        <p>Your Company will seamlessly unlock effortless, world-class growth.</p>`),
    );
    const ids = ruleIds(result.findings);
    expect(ids.has('leftover.lorem')).toBe(true);
    expect(ids.has('leftover.assistant-phrases')).toBe(true);
    expect(ids.has('leftover.your-company')).toBe(true);
    expect(result.tier).toBe('Pure Slop');
  });

  it('does not read ordinary English as a placeholder brand', () => {
    // "Start your company" (stripe.com) and "your company's memory" (slack.com)
    // both scored as unreplaced boilerplate at weight 16.
    for (const copy of ['Start your company today.', "Search your company's entire memory."]) {
      const result = analyze(page(`<h1>Northwind</h1><p>${copy}</p>`));
      expect(ruleIds(result.findings).has('leftover.your-company')).toBe(false);
    }
  });

  it('still catches a title-cased brand slot', () => {
    const result = analyze(page('<h1>Northwind</h1><p>Your Company will transform billing.</p>'));
    expect(ruleIds(result.findings).has('leftover.your-company')).toBe(true);
  });
});

describe('a reserved example address is not a contact detail', () => {
  const fired = (html: string): boolean =>
    ruleIds(analyze(html).findings).has('leftover.placeholder-contact');

  // Both of these charged supabase.com 8 points. RFC 2606 reserves example.com
  // for documentation, so using it in a snippet is following the standard.
  it('ignores a placeholder address inside a code sample', () => {
    expect(
      fired(
        page(`<h1>Auth</h1>
          <pre><code>supabase.auth.signUp({ email: 'user@example.com', password: 'secret' })</code></pre>`),
      ),
    ).toBe(false);
  });

  it('ignores a table of demo rows', () => {
    expect(
      fired(
        page(`<h1>Database</h1><table><thead><tr><th>name</th><th>email</th></tr></thead>
          <tbody>
            <tr><td>Alice Johnson</td><td>alice@example.com</td></tr>
            <tr><td>Bob Smith</td><td>bob@example.com</td></tr>
          </tbody></table>`),
      ),
    ).toBe(false);
  });

  it('catches an address the page actually offers as its own', () => {
    expect(fired(page('<h1>Northwind</h1><p>Get in touch: hello@example.com</p>'))).toBe(true);
  });

  it('catches a placeholder behind a mailto with no invitation nearby', () => {
    expect(
      fired(page('<footer><a href="mailto:info@yourdomain.com">Write to us</a></footer>')),
    ).toBe(true);
  });

  it('catches a number reserved for fiction offered as the one to call', () => {
    expect(fired(page('<footer><a href="tel:+15550142">Call us</a></footer>'))).toBe(true);
  });

  it('names which of the two it found rather than offering both', () => {
    const finding = analyze(
      page('<h1>Northwind</h1><p>Get in touch: hello@example.com</p>'),
    ).findings.find((f) => f.ruleId === 'leftover.placeholder-contact');
    expect(finding?.evidence).toContain('hello@example.com');
    expect(finding?.evidence).not.toContain('555');
  });
});

describe('truncation must not turn a bundle into page copy', () => {
  it('ignores an unterminated <script> left by truncation', () => {
    // netflix.com is 3.2MB, gets cut mid-bundle and leaves a <script> with no
    // closing tag, so 1.2MB of JavaScript survived as "visible text".
    const html =
      '<html><body><p>Real copy.</p><script>var x=1; // TODO: fix this' +
      ' and a lot of minified bundle text that is not page copy';
    const result = analyze(html);
    expect(ruleIds(result.findings).has('leftover.todo-in-production')).toBe(false);
  });

  it('still strips a properly closed script', () => {
    const result = analyze('<html><body><script>var a=1</script><p>After.</p></body></html>');
    expect(result.title).toBeNull();
    expect(ruleIds(result.findings).has('leftover.todo-in-production')).toBe(false);
  });
});

describe("a framework's inline sheet is not the author's design", () => {
  it('does not read a React Native Web sheet as authored CSS', () => {
    // twitter.com serves 62.5KB and 1540 rules under this id against 6KB of
    // class attributes actually used.
    const rnw =
      '<style id="react-native-stylesheet">.r-1{background-image:radial-gradient(circle,#f0f 0%,#0ff 70%);filter:blur(60px)}</style>';
    const result = analyze(`<html><head>${rnw}</head><body><h1>Feed</h1></body></html>`);
    expect(ruleIds(result.findings).has('layout.gradient-blob')).toBe(false);
  });

  it('still reads an ordinary inline <style> as authored', () => {
    const html =
      '<html><head><style>.hero{filter:blur(60px);background:linear-gradient(90deg,#a0f,#0af)}</style></head>' +
      '<body><h1>Hero</h1></body></html>';
    expect(ruleIds(analyze(html).findings).has('layout.gradient-blob')).toBe(true);
  });
});

describe('paired patterns must describe one element', () => {
  it('does not pair a border and a shadow from different rules', () => {
    const css = `.nav{border-bottom:1px solid #ddd}${'.filler{color:#111}'.repeat(400)}.modal{box-shadow:0 0 25px rgba(0,0,0,0.2)}`;
    const result = analyze(page('<h1>Northwind</h1>', css));
    expect(ruleIds(result.findings).has('impeccable.thin-border-wide-shadow')).toBe(false);
  });

  it('fires when both sit on one element', () => {
    const css = '.card{border:1px solid #ddd;box-shadow:0 0 25px rgba(0,0,0,0.2)}';
    const result = analyze(page('<h1>Northwind</h1>', css));
    expect(ruleIds(result.findings).has('impeccable.thin-border-wide-shadow')).toBe(true);
  });
});

describe('axis policy', () => {
  it('keeps measured-inverted rules off the score', () => {
    // Each fires more on hand-built pages than generated ones. Re-scoring any of
    // them needs new evidence, not new intuition.
    for (const id of [
      'structure.oversized-payload',
      'structure.no-viewport',
      'leftover.placeholder-links',
      'impeccable.flat-type-hierarchy',
      'impeccable.hover-scale-transform',
      'craft.layout-transition',
    ]) {
      expect(QUALITY_AXIS_RULES.has(id)).toBe(true);
    }
  });

  it('reports placeholder links without scoring them', () => {
    const body = `<h1>Northwind</h1>${'<a href="#">Link</a>'.repeat(6)}`;
    const result = analyze(page(body));
    expect(ruleIds(result.qualityFindings).has('leftover.placeholder-links')).toBe(true);
    expect(ruleIds(result.findings).has('leftover.placeholder-links')).toBe(false);
  });

  it('detects a client-rendered shell and still scores it by default', () => {
    const shell = `<!doctype html><html lang="en"><head><title>App</title></head><body><div id="root"></div>${'<script>window.__D={};</script>'.repeat(200)}</body></html>`;
    const result = analyzer.analyze(PageSnapshot.create({ url: 'https://app.test/', html: shell }));
    expect(result.caveats.isClientRendered).toBe(true);
    expect(result.unassessableFindings).toHaveLength(0);
    expect(ruleIds(result.findings).has('structure.thin-shell')).toBe(true);
  });

  it('moves structural findings off the score when suppression is requested', () => {
    const shell = `<!doctype html><html lang="en"><head><title>App</title></head><body><div id="root"></div>${'<script>window.__D={};</script>'.repeat(200)}</body></html>`;
    const result = analyzer.analyze(
      PageSnapshot.create({ url: 'https://app.test/', html: shell }),
      {
        suppressShellRules: true,
      },
    );
    expect(ruleIds(result.unassessableFindings).has('structure.thin-shell')).toBe(true);
    expect(ruleIds(result.findings).has('structure.thin-shell')).toBe(false);
  });
});

describe('registry', () => {
  it('registers every rule with a unique id', () => {
    const registry = createDefaultRegistry();
    expect(registry.size).toBeGreaterThan(60);
    expect(new Set(registry.all().map((r) => r.id)).size).toBe(registry.size);
  });

  it('honours rule exclusions, which the eval harness relies on', () => {
    const registry = createDefaultRegistry();
    const filtered = registry.select({ excludeRules: ['fingerprint.lovable'] });
    expect(filtered.some((r) => r.id === 'fingerprint.lovable')).toBe(false);
    expect(filtered.length).toBe(registry.size - 1);
  });

  it('survives a rule that throws', () => {
    const registry = createDefaultRegistry();
    registry.register({
      id: 'test.explodes',
      category: 'craft',
      weight: 10,
      label: 'Always throws',
      execute: () => ({ evidence: null, error: 'boom' }),
    } as never);

    const result = new SlopAnalyzer(registry).analyze(
      PageSnapshot.create({ url: 'https://northwind.test/', html: page('<h1>Hi</h1>') }),
    );
    const failed = [...result.findings, ...result.qualityFindings].find(
      (f) => f.ruleId === 'test.explodes',
    );
    expect(failed?.error).toBe('boom');
    expect(failed?.weight).toBe(0);
  });
});
