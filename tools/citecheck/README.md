# Citecheck

Citecheck finds technical barriers between a public site and the machines that
collect material for answer engines.

It crawls beyond the home page, reads the HTML the server returns, checks the
site's crawler instructions, and compares a normal fetch with one made using a
recognised crawler identity. It is one reading in the shared
[Readout console](../../apps/console).

![A Citecheck report showing a Legible result and one minor finding](../../assets/citecheck.png)

## Score

The score runs from 0 to 100, with higher being better. It describes access to
served content, not writing quality and not the likelihood of being cited.

| Tier | Score | Meaning |
|---|---|---|
| Legible | 81-100 | A machine can retrieve and use the page |
| Patchy | 61-80 | Most content is available, with obstacles |
| Obscured | 41-60 | Only fragments are reliable |
| Unreadable | 0-40 | The page provides nothing usable |

Findings have four impacts:

- **Blocker:** prevents fetching, indexing, or quoting; one blocker caps the
  score in the Unreadable band.
- **Major:** breaks an important technical signal or misdirects a signal the
  page attempted to provide.
- **Minor:** a real, limited defect worth correcting.
- **Not found:** an optional machine-facing signal is absent; it is shown but
  costs no points.

Not found is deliberately neutral. Frequently cited references omit JSON-LD,
meta descriptions, or canonical links. Their absence cannot be treated as a
barrier when those pages are demonstrably retrieved and quoted.

## Calibration

Weights are checked against Wikipedia, MDN, and the Python, React, nginx, and
Postgres reference sites. These pages must remain Legible because answer engines
already cite them in practice.

The corpus keeps best-practice advice separate from actual access barriers.
Missing optional metadata may be useful to report, but a page that serves useful
HTML is not unreadable because it omitted JSON-LD. By contrast, `noindex`, an
empty client-rendered shell, a crawler-specific `403`, or a canonical pointing
to another host can prevent the page from being used regardless of its other
strengths.

Calibration and false-positive fixtures live in the core test suite. A rule is
not accepted solely because it sounds like good SEO advice.

## What it checks

### Access

- meaningful content in the server-rendered HTML rather than an empty mount;
- `noindex`, `nosnippet`, `max-snippet:0`, and `noarchive` in meta tags or the
  `X-Robots-Tag` header;
- different or empty responses returned to a recognised crawler;
- crawler disallow rules and invalid `robots.txt` syntax;
- contradictions among `robots.txt`, `llms.txt`, and the sitemap;
- sitemap discovery and whether crawled pages appear in it.

`noindex` on a sign-in, sign-up, or checkout page is reported without costing
points. The exemption applies when an authentication action or transaction step
appears as a complete path segment in a supported language, or when the markup
contains a password field. Public-content locations such as `/profile/`,
`/dashboard/`, `/members/`, and `/registro/` are not exempt. Other restrictive
directives keep their normal weight on account pages.

### Crawler posture

Citecheck reports whether each known answer-engine crawler is allowed, blocked,
or unmentioned by `robots.txt`.

This posture is not scored. Blocking a crawler can be a deliberate policy. A
contradiction is scored when the site invites or lists content in one file and
blocks the same content in another.

### Machine-readable claims

The engine parses JSON-LD graphs, including nested entities. It checks whether
the data parses, has a type, identifies an `Organization` or `Person`, and
provides corroborating `sameAs` data when present. OpenGraph is read from both
`property` and the widely used `name` form.

Absent structured data is reported but unscored. Invalid structured data costs
points because the page attempted to publish a signal that machines cannot use.

### Document signals

Citecheck reads titles, descriptions, canonical links, language declarations,
headings, anchor destinations and text, image alternatives, hreflang values,
mixed content, redirect behaviour, and internal link health. Across a crawl it
also detects duplicate metadata, broken links, redirect chains, and orphan pages.

An article that declares an article schema without a date receives a finding.
The engine does not otherwise judge whether prose is authoritative, complete,
well sourced, or pleasant to read.

The generated [rule catalogue](../../.documentation/RULES.md) contains the full
current list.

## Relationship to Lighthouse

Citecheck covers the technical checks in Lighthouse's SEO category: crawlability,
document titles, meta descriptions, status codes, descriptive links, crawlable
anchors, robots syntax, image alternatives, hreflang, canonical links, and
structured data.

It also checks signals Lighthouse does not cover, including crawler-specific
responses, per-agent robots posture, sitemap contradictions, empty
client-rendered shells, and crawl-wide duplication and link structure.

Some findings are graded rather than flat. A few script-only links are different
from navigation built entirely from them; one mixed-content image is different
from a blocked script or stylesheet; and a canonical pointing to another content
page is different from every page pointing to the home page.

## What it does not claim

Citecheck does not provide:

- keyword volume, rank tracking, backlink data, or competitor research;
- a prediction that a page will rank or be cited;
- Core Web Vitals or field performance data;
- headless rendering of the completed client application;
- a judgement of the prose or the author's expertise.

Those jobs need outside datasets, a browser render, or subjective assessment.
This tool stays within evidence available from a public URL.

## Request behaviour

Every target request is `GET`. Citecheck submits no form and creates no account.

Requests normally identify the tool. One request per reading uses a recognised
crawler User-Agent: the second fetch of the entry page. Without that identity, a
bot filter would treat the request as an ordinary visitor and the comparison
could not detect crawler-specific blocking. The request carries no credentials
and its response is used only for comparison.

A reading fetches each crawled page plus `robots.txt`, the sitemap, `llms.txt`,
and the crawler-identity copy of the entry page. See
[SECURITY.md](../../SECURITY.md) before scanning a site you do not control.

## Run locally

Start every service:

```bash
pnpm install
pnpm dev
```

Or start Citecheck and the console:

```bash
pnpm --filter @lumioguard/citecheck-api dev
pnpm --filter @lumioguard/console dev
```

The console is at `http://127.0.0.1:5200`; the Worker is at
`http://127.0.0.1:8830`. Use the Citecheck page or add `?tools=citecheck` to the
scan URL.

```text
POST /api/crawl  { "url": "example.com" }
POST /api/scan   { "url": "example.com" }
GET  /api/health
```

The console deliberately sends no crawl dimensions. The API applies the shared
defaults. Clients may supply bounded `depth` and `maxPages` values when calling
the API directly.

## Package layout

```text
core/
  read/         parsed served documents
  access/       robots, directives, rendering, and crawler comparison
  structured/   JSON-LD and machine-readable claims
  document/     head, outline, language, and references
  answer/       article-specific answerability checks
  crawl/        traversal and site roll-up
  scoring/      findings to score, tier, and headline
api/
  Cloudflare Worker responsible for fetching, context, and mapping
```

The core contains no I/O. Internal finding codes and fix text are dropped at the
wire mapper. The public crawler roster is the exception to the private-rule
boundary because its User-Agent tokens are published by their operators and the
report needs to name each posture.

Shared contracts live in `@lumioguard/shared`; the report surface lives in
`apps/console/src/tools/citecheck`.

## Configuration

| Variable | Used by | Default |
|---|---|---|
| `ALLOWED_ORIGINS` | Worker | `*` during development |
| `CITECHECK_INGEST_SECRET` | Worker | unset; no reading is recorded |
| `LUMIOGUARD_API_BASE_URL` | Worker | unset; required with the ingest secret |
| `VITE_CITECHECK_API_URL` | Console | relative local proxy |
| `VITE_LUMIOGUARD_APP_URL` | Console | unset; no hand-off or branding |
| `VITE_POSTHOG_KEY` | Console | unset; analytics disabled |

All variables are optional for local use. See `api/.dev.vars.example` and
`../../apps/console/.env.example`.

## Principles

1. Make claims from what the server returned.
2. Separate deliberate policy from broken implementation.
3. Quote evidence the site owner can locate.
4. Crawl beyond the front page.
5. Prefer a missed check to a confident false positive.
