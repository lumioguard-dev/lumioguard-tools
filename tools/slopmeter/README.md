# Slopmeter

**How much of what visitors see is still the template a generator shipped?**

Slopmeter crawls a few pages and scores how closely the site's visual and verbal
choices match the defaults every generated site ships with.

It is one of the readings in [Readout](../../apps/console), which runs every tool
you pick against one address and lands them on a single verdict. This is
Slopmeter's own section of that report:

![Slopmeter's section of the report: a Lightly Templated score of 74, and the
weighted tells that produced it](../../assets/slopmeter.png)

*Reading [leakpeek-demo.vercel.app](https://leakpeek-demo.vercel.app/). Every
point comes with the reason it was scored, so the number can be argued with.*

## Who it is for

Someone who shipped a site fast and wants to know whether it looks like everyone
else's. Success is a stranger understanding the verdict, and why it landed there,
within seconds, then trusting it enough to pass it on.

## The verdict

Score is **0–100 and HIGHER IS BETTER**, matching every other score in the
suite and the app it hands off to.

| Tier | Score | Meaning |
|---|---|---|
| Hand-Crafted | 81–100 | Somebody made decisions here |
| Lightly Templated | 61–80 | Mostly deliberate, leaning on a few defaults |
| Heavily Templated | 41–60 | The template is doing most of the talking |
| Pure Slop | 0–40 | Stock everything |

## What it judges, and what it refuses to

**It judges the OUTPUT, never the author and never the tool.** Which builder made
a page is reported and scores exactly zero. A site built with an AI builder that
someone actually designed scores clean; a hand-coded page of stock defaults does
not. A detector that charges for the builder's fingerprint has to call the first
one slop, and is wrong.

Two further claims that hold because of how the engine is built:

- **Rules are measured, not asserted.** Each rule's weight is validated against a
  labelled corpus. Six intuitively appealing rules were measured *off* the score
  because they fire more often on hand-built pages than generated ones.
- **It crawls.** Breadth across a level and depth through levels, because the
  tells worth finding are rarely on the front page.

Each tell carries a weight and its own evidence, and the report shows the
arithmetic. A number you cannot see the reasons for is a number you cannot argue
with.

### What it cannot see

**No JavaScript is executed.** A client-rendered shell is read as a shell. The
score is computed the same way either way, so a reader currently cannot tell a
page that was fully read from one that was mostly empty. `caveats.isClientRendered`
is returned by the API and not yet surfaced. That is a known, open gap, recorded
here rather than hidden.

## The rule pack is the product

Rule ids, categories and the catalogue **never cross the wire**. The report shows
a tell's label and its evidence, which is what the visitor needs, and nothing
that reconstructs the detector. There is no route that returns the rule pack, and
`api/__tests__/wire-boundary.test.ts` exists because the boundary is invisible:
nothing breaks and no screen looks wrong if a mapper quietly spreads the domain
object onto a response.

## Running it

```bash
pnpm install
pnpm dev            # every tool, plus the console on http://127.0.0.1:5200
```

The console is the only page, so running this tool on its own means running its
Worker and pointing the console at it:

```bash
pnpm --filter @lumioguard/slopmeter-api dev   # http://127.0.0.1:8810
pnpm --filter @lumioguard/console dev        # http://127.0.0.1:5200
```

Turn the other readings off in the picker, or put `?tools=slopmeter` in the
address. The console proxies `/slopmeter/api` to the Worker above.

```
POST /api/crawl  { "url": "example.com", "maxPages": 15, "depth": 2 }
POST /api/scan   { "url": "example.com" }        one page
GET  /api/health
```

## How it is built

```
core/   the engine. Isomorphic, no I/O, no network, so the suite runs offline
  rules/       the catalogue, its weights and the registry
  analysis/    the page, parsed into what rules ask about
  scoring/     tells → score, tier, headline
  crawl/       breadth and depth across a site
api/    Cloudflare Worker (Hono). Owns fetching, screenshots and the clock
```

Its surface lives with the other tools' in the console, at
`apps/console/src/tools/slopmeter/`: a client, the report panels, its ink, and the
descriptor that puts it in the picker and the consolidated score.

`core` never imports from `api`, and the console never imports `core`, which
would ship the whole rule pack to the browser where anyone could read it.
Anything both need lives in `@lumioguard/shared`, and a number the surface needs
from the scorer, such as what a finding cost, is put on the wire by the mapper
rather than recomputed from a second copy of the table.

The drawn surface, transport and browser-side plumbing are shared with the other
tools via `@lumioguard/ui`, `@lumioguard/api-core` and `@lumioguard/web-core`.

### The parity suite

`core` carries a parity test that re-scores a cached corpus against the
JavaScript detector this engine was ported from, and requires **exact** matches.
That corpus is not in this repository, so the suite skips itself unless
`SLOPMETER_PARITY_ROOT` points at a checkout of it.

Where it runs, it is the safety net for any engine change: if it drifts, the
change altered scoring, whether or not that was the intent. Never retune the
fixtures to make it pass.

## Configuration

| Variable | Where | Default |
|---|---|---|
| `ALLOWED_ORIGINS` | api | `*` in development |
| `SLOPMETER_INGEST_SECRET` | api | unset (nothing is sent anywhere) |
| `LUMIOGUARD_API_BASE_URL` | api | unset (required alongside the secret) |
| `VITE_SLOPMETER_API_URL` | console | empty (the console proxies `/slopmeter/api`) |
| `VITE_LUMIOGUARD_APP_URL` | console | unset (no button, no offer, no wordmark) |
| `SLOPMETER_PARITY_ROOT` | tests | unset (the parity suite skips) |

All optional; see `api/.dev.vars.example` and `apps/console/.env.example`. Slopmeter is a
complete tool with none of them set. With `VITE_LUMIOGUARD_APP_URL` unset, which
is the default, the word LumioGuard does not appear on the page at all.

The two api variables are required together: a secret without an address records
nothing, deliberately, so a fork cannot post its readings to an API it does not
own. Set all three and the report becomes the front of the
[LumioGuard](https://lumioguard.dev) funnel, where a completed reading turns into
tracked issues.

## Principles

1. **Judge the output, never the author.** The tiers describe what shipped.
2. **Every number shows its reasons.** A score without its tells is an opinion.
3. **Weights are measured against a corpus, not argued for.**
4. **The rule pack does not cross the wire.**
