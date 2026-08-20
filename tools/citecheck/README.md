# Citecheck

**Can an answer engine cite this site?**

Citecheck reads the site the way a crawler does, asks again as one, and reports
what stands between those pages and being quoted.

It is one of the readings in [Readout](../../apps/console), which runs every tool
you pick against one address and lands them on a single verdict. This is
Citecheck's own section of that report:

![Citecheck's section of the report: a Legible score of 98, one minor finding,
and three signals flagged as not found rather than charged
for](../../assets/citecheck.png)

*Reading [leakpeek-demo.vercel.app](https://leakpeek-demo.vercel.app/). The
`NOT FOUND` rows are the point: a signal the page does not publish is flagged
and weighs nothing, because the references answer engines quote every day are
missing several of them apiece.*

## Who it is for

Someone who built a site, put it on the internet, and is starting to notice that
a growing share of the people who should be finding it are asking a model
instead of typing a query. They are not an SEO consultant. They will not read a
spec. They need to know, in one screen, whether the thing that answers questions
about their industry can read their site at all.

The answer has to be provable from what the server sent. "Your content could be
more authoritative" is worthless; "the served HTML for this page contains 0 words
and an empty `<div id="root">`" is not.

## The verdict

Score is **0-100 and HIGHER IS BETTER**, matching every other score in the
suite and the app it hands off to. It is a citation score,
and no surface may render it as one.

The bands name **how much of the page a machine ends up with**, which is the one
thing this tool can observe. It cannot know whether the page says anything worth
quoting, so it does not say.

| Tier | Score | Meaning |
|---|---|---|
| Legible | 81-100 | A machine reading this page gets the whole of it |
| Patchy | 61-80 | A machine gets most of the page and works around the rest |
| Obscured | 41-60 | A machine gets fragments, and infers the rest for itself |
| Unreadable | 0-40 | A machine gets nothing it can use from this page |

Findings rank **Blocker → Major → Minor**, with a fourth entry, **Not found**,
that is a flag rather than a rank and costs nothing. One blocker is what puts a
page in the top band on its own.

**Any blocker pins the score down into the worst band.** A page
that says `noindex`, or serves an empty document to anything without a
JavaScript engine, cannot be quoted at all, and no amount of good structured
data underneath changes that.

Two earlier sets were retired, and are recorded here because the mistake is easy
to repeat. *Quotable / Thin / Guesswork / Invisible* promised the page would be
quoted, and *Thin* named content volume: it landed on Wikipedia, which reaches
that band on a missing meta description alone. *Clear / Passable / Obstructed /
Blocked* described the path rather than the page, and *Passable* reads as a
verdict on quality, the way a passable meal is a mediocre one.

### What the score is calibrated against

The weights below that floor are set by a corpus of pages answer engines
**demonstrably quote every day**: Wikipedia, MDN, and the Python, React, nginx
and Postgres references. The rule is that such a page must come out Legible,
because nothing is in fact standing in its way.

That corpus overturned most of a first cut made from intuition. Five of the six
ship **no JSON-LD at all**. Four carry **no meta description**. Two have **no
`h1`**. Three have **no canonical**. None of those can be a barrier to citation
when the most-cited pages on the web are missing them, so every one is a minor
finding. Before this, the nginx reference scored 68, in the top band, about a
plain served HTML page that is quoted constantly.

**Best practice is not the same as a barrier**, and only the barriers are
scored heavily. What remains a blocker is definitional rather than measured: a
page that says `noindex`, serves no text without JavaScript, answers a crawler
with `403`, or hands its canonical to another host cannot be quoted whatever
else is true of it.

### What each rank means

Three of them price something. The fourth does not.

- **Blocker.** The page cannot be fetched, indexed or quoted at all. Definitional
  rather than measured, and it pins the score on its own.
- **Major.** Lighthouse's SEO category would fail the page for it, or the page
  actively misdirects a signal it has already earned.
- **Minor.** True, worth fixing, and costs the page something small.
- **Not found.** A signal the page does not publish. It is listed with the rest
  and **weighs nothing**, so a page carrying only these scores zero.

`Not found` exists because pricing an absence said the opposite of what the
corpus shows. Five of the six references answer engines quote every day ship no
JSON-LD, four carry no meta description, three have no canonical. Charging two
points apiece built a score out of choices those pages made and are quoted
anyway. **Absence is a choice; only a broken attempt is a defect.** A canonical
that will not parse, JSON-LD that will not read, an hreflang no engine
recognises: somebody meant those to work and they do not, and they keep their
weight.

Seven checks carry the flag: robots.txt, a sitemap, a canonical, a meta
description, OpenGraph, structured data and a declared language. The line is
that the page publishes them **for machines**. Anything a human reader also
meets, an `h1`, a heading, a link, an image's alt text, is still judged as a
finding, because a page missing those is missing something visible.

The words are two on purpose. "Missing" reads as an accusation, and the report
has no business calling a thing missing that the page never owed anyone.

Three findings are **graded** rather than flat, because Lighthouse's result is
pass or fail and this score is additive. A rule that fails an audit on one bad
element is right for a pass/fail badge and wrong for points.

| Finding | Major when | Minor when |
|---|---|---|
| `document.uncrawlable-anchors` | script navigation is how the page works | a handful, as microsoft.com's skip link is one of about a hundred |
| `document.mixed-content` | a script or stylesheet, which a browser refuses outright | an image, as healthline.com's comScore pixel is |
| `document.canonical-mismatch` | the canonical names the home page, the template bug Lighthouse charges | it names another content page, which is what the tag is for |

Weights live in one file, `core/src/scoring/CiteScore.ts`, and
`core/src/__tests__/calibration.test.ts` holds the corpus's verdict in both
directions: a page with none of the metadata stays Legible, and each blocker
case still lands Unreadable.

## What it checks

A reading is a **crawl**, not a page scan. The pages worth citing are almost
never the front door, so a homepage-only reading reports on the one page nobody
asks a question about. Findings that never appear on the entry page are called
out as such, because those are the ones the owner has never seen.

### Access: can a machine reach the words

- **A body that is empty until JavaScript runs.** Proven from the served HTML: a
  closed, empty mount element, or a framework marker with no prose beside it.
  Most crawlers that feed answer engines do not run JavaScript, so what they
  store for that URL is a blank document. This is the headline finding and the
  reason the tool exists.
- **`noindex`, `nosnippet`, `max-snippet:0`, `noarchive`**, read from both
  `<meta name="robots">` and the `X-Robots-Tag` header, because either alone is
  the whole instruction. `nosnippet` is the quiet one: it permits indexing and
  forbids anything being quoted.
- **Crawlers refused, or quietly emptied.** The same URL is fetched twice, once
  as a browser and once as a crawler. A `403` to the second is a blocker; so is
  a `200` that comes back with almost none of the page, because nothing logs an
  error and what gets stored is simply blank. Materially less, rather than
  almost nothing, is a major finding. This is the most expensive accident in the
  set, and the one nobody catches, because the site looks perfect in the only
  place its owner ever looks.
- **Contradictions between the site's own files.** An `llms.txt` inviting AI
  readers beside a `robots.txt` turning them away; a page listed in the sitemap
  and disallowed in robots.txt. Whichever file is right, the other is stale.
- **The sitemap**: whether one exists, whether robots.txt names it, and whether
  this page is in it.

### The crawler posture: reported, never scored

What `robots.txt` says to each of the crawlers behind the answer engines, one
row each: **allowed**, **blocked**, or **unmentioned**.

**Blocking one of these is a decision, not a defect.** Plenty of sites mean it,
and scoring it would be charging someone for meaning what they said, which is
the false positive that destroys trust in a whole report. It is listed and
confirmed, never corrected. What is scored is a *contradiction* between two files
the same site serves.

`unmentioned` is its own answer and not a synonym for allowed: nothing in
robots.txt applies to that agent at all, so it may read by default, and the next
edit could change that with nobody noticing.

### Claims: what the page states in machine-readable form

JSON-LD present, parsing, and typed. An `Organization` or `Person` naming the
publisher, and a `sameAs` anywhere in the graph corroborating it. OpenGraph,
read from `name` as well as the spec's `property`, because MDN ships the former
and every real consumer honours it.

Entities are found **nested**, not only at the top level, because that is where
they live: Wikipedia carries its publisher as `author` one level inside the
Article. Looking only at the top level reported the most-cited page on the web
as never saying who publishes it.

Two checks that were here are gone. A **headline conflict** between the JSON-LD
and the `<title>` fired on Wikipedia, which uses `headline` for a short
description: a page that is cited more than any other cannot be the example of a
defect. And **dates** are checked once, under answerability, having been checked
in both places so one missing date was charged twice.

### Document: the parts a crawler has always read

Title present, distinguishing, and not the scaffold's. Meta description.
Canonical present, absolute, and not pointing at another host. One `h1`, no
skipped levels, no empty headings. `lang`. Internal links, anchor text that
describes its target, and alt coverage.

### Answerability: what is left of it

One check. **An article with no date**, on a page whose own schema says it is
one, because that page declared a type with a date field and left it empty.

Six others were here and were **deleted rather than tuned**, after reading
thirty-three real pages and checking every finding by hand. They are listed
below with what condemned them, because each looked reasonable when it was
written and the reasoning that removed them is the part worth keeping.

## Measured against Lighthouse

Lighthouse's SEO category is the benchmark for the technical half of this tool,
because it is public, versioned, and something a site owner can run themselves
to check the answer. Every audit in it is covered:

| Lighthouse audit | Citecheck |
|---|---|
| `is-crawlable` *(weighted above every other)* | `access.noindex`, `access.nosnippet`, **`access.disallowed`** |
| `document-title` | `document.no-title`, and `stock-title`, `long-title` |
| `meta-description` | `document.no-description`, `thin-description` |
| `http-status-code` | a non-200 fails the reading, with the status reported |
| `link-text` | `document.vague-anchors`, using **Lighthouse's own word list** |
| `crawlable-anchors` | **`document.uncrawlable-anchors`** |
| `robots-txt` | `access.no-robots`, and **`access.invalid-robots`** for its syntax |
| `image-alt` | `document.missing-alt`, at Lighthouse's threshold of **any** image |
| `hreflang` | **`document.invalid-hreflang`**, **`document.relative-hreflang`** |
| `canonical` | `no-`, `bad-`, `multiple-`, `foreign-`, `canonical-mismatch`, `canonical-elsewhere` |
| `structured-data` *(manual there)* | `structured.absent`, `invalid`, `untyped`, `no-entity` |

The four in bold were missing, and one of them sat inside the audit Lighthouse
weights highest: a page simply disallowed in robots.txt was never reported,
because the directive was read only to decide whether the sitemap contradicted
it. `notion.com/invite/` is disallowed and now says so.

Two were realigned rather than added. The non-descriptive anchor list is lifted
from Lighthouse's `link-text` audit instead of written from intuition, which is
what had reported stripe.com for an anchor reading "Link", the name of their
product. And `image-alt` needed half a page's images to be undescribed before it
said anything, so a page with ten missing among a hundred passed in silence;
Lighthouse fails on one, and so does this.

**Beyond Lighthouse**, and kept because it is still technical SEO a crawl can
prove: sitemap presence and contradictions, duplicate titles and descriptions
across a crawl, broken internal links, redirect chains, http and mixed content,
meta refresh, `h1` and heading structure, `html lang`, orphan pages. And beyond
it again, the things this tool exists for: content that is absent without
JavaScript, the crawler-identity comparison, and the per-agent robots posture.

## Rules that were removed

Every one of these fired confidently on pages that are fine. A reader cannot
tell a wrong finding from a right one, so each of them put every other finding
in doubt.

| Removed | What condemned it |
|---|---|
| `answer.faq-unmarked` | A question-shaped heading is not an FAQ. Fired on BBC and Guardian **news headlines**, on Apple's "Why Apple is the best place to shop iPhone." (a statement), and on "How Inflation Impacts Prices" (not a question) |
| `answer.thin` | The 120-word line was invented. Nothing makes 119 words worse than 121 |
| `answer.empty` | Counted words inside `<main>`, which canva.com marks around seventeen words of a 1,114-word page. A working site was called empty, at blocker severity |
| `answer.no-chunks` | Guessed how a retriever splits a page. Fired on the nginx reference, quoted daily |
| `answer.boilerplate` | Measured against this engine's own guess at where chrome ends. Called apple.com navigation-dominated on 4,168 words of content |
| `answer.no-structure` | Asserted that prose without a list is harder to quote. Nothing here can show that |
| `answer.unsourced-figures` | Cannot tell a statistic from a price. Fired on tailwindcss.com over `$99 · $99 · $99` |
| `document.skipped-level` | Fired on the React reference, Britannica, Healthline and Investopedia. Heading order is neither a citation nor a ranking barrier |
| `document.short-title` | Fired on `iPhone - Apple`. A character count says nothing about whether a title is good |
| `document.temporary-redirect` | A geo-redirect **should** be a 307, because the destination varies by visitor. stripe.com → `/ae` is correct practice and was called a defect |
| `structured.no-sameas` | Absence of `sameAs` is not a defect. The NHS does not need corroborating |

Four parser defects were fixed rather than removed, each found the same way:

- **Markup read out of `<script>`.** cnn.com's only `<h1>` is a string in a
  Handlebars template, and eight of its headings were JavaScript. Code now comes
  out before anything reads elements.
- **A bare `alt` counted as missing.** `<img src="…" alt>` is HTML5's empty
  attribute syntax and means `alt=""`, a deliberately decorative image.
  apple.com/airpods writes it fourteen times.
- **`Organization` matched exactly.** bbc.com, cnn.com and nytimes.com declare
  `NewsMediaOrganization`; three of the most attributable publishers on the web
  were reported as naming nobody.
- **An empty `content=""` read as a short description** rather than as none.

## What it does not do, and no surface may claim

- **Keyword volume, rank tracking, backlinks, competitors.** All need
  third-party data. URL only means URL only.
- **Any prediction of a ranking position, or of being cited.** That is the line
  between measuring and guessing.
- **Core Web Vitals and performance.** Those need a real render and field data.
- **Headless rendering.** Everything here is read from what the server sent. The
  JavaScript finding is provable without a browser, and a paid rendering binding
  would be something a fork could not have.
- **Judge how well the page is written.** There was a check that looked for a
  self-contained opening sentence naming the page's subject, and it is gone. It
  charged lovable.dev a major finding because its `<h1>` is the kicker "AI App
  Builder" while the page opens "Build something Lovable". A heuristic about
  prose cannot be proven to an author, and a finding they cannot verify is one
  they cannot act on.

## The two guarantees

**Read, never write.** Every request is a `GET`, and there is no code path that
writes. Nothing is submitted, no account is created, no form is posted.

**One exception to identifying ourselves.** Every request names the tool in its
User-Agent except one: the second fetch of the entry page, which carries a real
crawler token, because that is the only way to find out what a bot filter does
when it recognises one. A filter that has never heard of `LumioGuard-Citecheck`
waves it through exactly as it waves a browser through, and the check would
report every site as clean. It is one `GET` of a URL already fetched, with no
credentials, and the response is used only to compare how much text came back.
See [SECURITY.md](../../SECURITY.md); a fork can remove it in one edit.

**Every finding is something the server sent.** Not a heuristic about quality,
not a guess about intent. The evidence is quoted from the page rather than
paraphrased, because a finding the author cannot locate in their own source is
one they cannot act on.

Unlike an exposure report there is nothing here to redact: a page's own markup is
already public to anyone with the URL.

## What a reading costs the target

One `GET` per page crawled, plus four for the site: `robots.txt`, the sitemap,
`llms.txt`, and the one crawler-identity fetch of the entry page. Those four are
listed in `api/src/services/SiteContextReader.ts`, which is where any number in
prose about them has to come from.

## Running it

```bash
pnpm install
pnpm dev            # every tool, plus the console on http://127.0.0.1:5200
```

The console is the only page, so running this tool on its own means running its
Worker and pointing the console at it:

```bash
pnpm --filter @lumioguard/citecheck-api dev   # http://127.0.0.1:8830
pnpm --filter @lumioguard/console dev        # http://127.0.0.1:5200
```

Turn the other readings off in the picker, or put `?tools=citecheck` in the
address. The console proxies `/citecheck/api` to the Worker above.

```
POST /api/crawl  { "url": "example.com" }      what the client calls
GET  /api/crawl?url=example.com&depth=2&maxPages=15
POST /api/scan   { "url": "example.com" }      one page only
GET  /api/scan?url=example.com
GET  /api/health
```

The client sends no `depth` or `maxPages`, deliberately: the API accepts them and
the button offers no way to choose, so a client sending its own numbers while the
copy described the defaults is the failure the repo's writing rule exists for.

## How it is built

```
core/   the engine. Isomorphic, no I/O, no network, so the suite runs offline
  read/        the served page, parsed once per reading
  access/      can a machine reach the words: robots, directives, rendering, cloaking
  structured/  what the page claims about itself in JSON-LD
  document/    head, outline and references
  answer/      is there a passage here worth returning
  crawl/       the site walk and its roll-up
  scoring/     findings to a score, a tier and a headline
api/    Cloudflare Worker (Hono). Owns fetching, timeouts and the clock
```

`core` never imports from `api`, and `web` never imports `core`, which would ship
the detection logic to the browser. Anything both need is domain vocabulary and
lives in `@lumioguard/shared`.

The rule pack stays off the wire: each finding's internal `code` and its `fix`
are dropped in the mapper, and `api/src/__tests__/wire-boundary.test.ts` exists
because nothing breaks and no screen looks wrong if a mapper spreads the domain
object onto the response.

The **crawler roster is the exception**, and deliberately so. Every token in it is
a public string published by its operator, so there is nothing to protect: the
value of the report is the posture, not the list.

The drawn surface, transport and browser-side plumbing are shared with the other
tools via `@lumioguard/ui`, `@lumioguard/api-core` and `@lumioguard/web-core`.

## Configuration

| Variable | Where | Default |
|---|---|---|
| `ALLOWED_ORIGINS` | api | `*` in development |
| `CITECHECK_INGEST_SECRET` | api | unset (nothing is sent anywhere) |
| `LUMIOGUARD_API_BASE_URL` | api | unset (required alongside the secret) |
| `VITE_CITECHECK_API_URL` | console | empty (the console proxies `/citecheck/api`) |
| `VITE_LUMIOGUARD_APP_URL` | console | unset (no button, no offer, no wordmark) |

All optional; see `api/.dev.vars.example` and `apps/console/.env.example`. Citecheck is a
complete tool with none of them set. With `VITE_LUMIOGUARD_APP_URL` unset, which
is the default, the word LumioGuard does not appear on the page at all.

The two api variables are required together: a secret without an address records
nothing, deliberately, so a fork cannot post its readings to an API it does not
own.

## Principles

1. **Prove it from what was served.** A finding is markup that is there or is
   missing, never a judgement about how good the writing is.
2. **A choice is not a defect.** Report a blocked crawler; charge only for a
   contradiction.
3. **Quote the page, do not paraphrase it.** Evidence the author cannot find in
   their own source is evidence they cannot act on.
4. **The front door is not the site.** Read past it, and say what was hiding.
5. **A false positive costs more than a miss.** A reader cannot tell a wrong
   finding from a right one, so one wrong finding puts every other finding in
   doubt. Every check here is measured against real pages before it ships; see
   `core/src/__tests__/false-positives.test.ts`, which is one case per finding
   that was confidently wrong about a site that was fine.
