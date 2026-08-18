# Slopmeter

**How much of what visitors see is still the template a generator shipped?**

Paste an address. Slopmeter crawls a few pages and scores how closely the site's
visual and verbal choices match the defaults every generated site ships with.

![The Slopmeter report: a Lightly Templated verdict on the demo app, with a
screenshot and the weighted tells that produced the score](../../assets/slopmeter.jpg)

*Reading [leakpeek-demo.vercel.app](https://leakpeek-demo.vercel.app/).*

## Who it is for

Someone who shipped a site fast and wants to know whether it looks like everyone
else's. Success is a stranger understanding the verdict, and why it landed there,
within seconds, then trusting it enough to pass it on.

## The verdict

Score is **0–100 and HIGHER IS WORSE**.

| Tier | Score | Meaning |
|---|---|---|
| Hand-Crafted | 0–19 | Somebody made decisions here |
| Lightly Templated | 20–39 | Mostly deliberate, leaning on a few defaults |
| Heavily Templated | 40–59 | The template is doing most of the talking |
| Pure Slop | 60+ | Stock everything |

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
pnpm --filter @lumioguard/slopmeter-web dev    # http://127.0.0.1:5210
pnpm --filter @lumioguard/slopmeter-api dev    # http://127.0.0.1:8810
```

Or `pnpm dev` from the repo root for every tool at once.

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
web/    React + Vite client
```

`core` never imports from `api`, and `web` never imports `core`, which would ship
113 rules to the browser. Anything both need lives in `@lumioguard/shared`.

The surface, transport and browser-side plumbing are shared with the other tools
via `@lumioguard/ui`, `@lumioguard/api-core` and `@lumioguard/web-core`.

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
| `VITE_API_BASE_URL` | web | empty (Vite proxies `/api`) |
| `VITE_LUMIOGUARD_APP_URL` | web | unset (no button, no offer, no wordmark) |
| `SLOPMETER_PARITY_ROOT` | tests | unset (the parity suite skips) |

All optional; see `api/.dev.vars.example` and `web/.env.example`. Slopmeter is a
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
