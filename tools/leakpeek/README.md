# Leakpeek

**What is this app exposing to anyone who has the URL?**

Paste an address. Leakpeek reads the page and its scripts, and where the bundle
points at a backend, it reads that too. Then it reports what a stranger can
already reach.

![The Leakpeek report: a Wide Open verdict on the demo app, with a critical
finding that a database table is readable without signing in](../../assets/leakpeek.jpg)

*Reading [leakpeek-demo.vercel.app](https://leakpeek-demo.vercel.app/), a
deliberately vulnerable app kept for testing.*

## Who it is for

Someone who built an app quickly, often with an AI builder, put it on the
internet, and has no idea whether it is leaking. They are not a security
engineer. They will not read a CVE. They need to know, in one screen, whether
strangers can read their users' data right now.

The answer has to be provable. "You might have a misconfiguration" is worthless;
"this table returned 3 rows to an unauthenticated request, columns `id`, `name`,
`email`" is not.

## The verdict

Score is **0–100 and HIGHER IS WORSE**. It is an exposure ladder, not a health
score, and no surface may render it as one.

| Tier | Score | Meaning |
|---|---|---|
| Sealed | 0–19 | Nothing obvious is leaking from the browser |
| Exposed | 20–39 | Something is readable that should not be |
| Cracked | 40–59 | More than one, or one that matters |
| Wide Open | 60+ | Anyone with the URL can read this app's data right now |

**Any critical finding pins the score to at least 60.** A leaked database is Wide
Open however tidy the rest of the site is.

## What it checks

### Passive: readable from the served response, on any URL

- **Secrets in the bundle.** `service_role` JWTs (decoded, `role` claim checked),
  Stripe `sk_live_`, AWS `AKIA`, Google `AIza`, OpenAI `sk-`, GitHub tokens.
  A Supabase **anon key is never reported**. It is public by design, and calling
  it a leak is the false positive that destroys trust in the whole report.
- **Source maps reachable.** A served `.js.map` ships readable source, comments,
  and sometimes keys the minified bundle hid.
- **Security headers.** CSP, HSTS, X-Frame-Options.
- **Privacy.** Trackers running with no consent gate, and data collection with no
  privacy policy linked. Trackers are matched by the DOMAIN they load from, never
  by a function name a minifier reproduces by coincidence.

### Active: read-only probes of the app's own backend

- **Supabase RLS.** Reads discovered tables with the anon key from the bundle.
  Rows returned unauthenticated means row-level security is off. This is the
  headline finding and the reason the tool exists.
- **Exposed files.** `/.env` and `/.git/config` from the web root, guarded
  against the SPA that answers `200` with its shell for any path.

**Not built yet, and no surface may claim them:** open storage buckets,
unauthenticated RPC, Base44-style auth bypass, and the Firebase / PocketBase /
Appwrite variants of open rules. Those platforms are fingerprinted today but
never probed.

## The three guarantees

**Read, never write.** The probe engine issues `GET` only. No
`INSERT`/`UPDATE`/`DELETE`, no mutating RPC, no account creation, no write to
storage. It is enforced structurally, by one request primitive in `ProbeRunner`
and no code path that writes, because the line between assessing a hole and
exploiting it is the line between a read and a write. A finding that could only
be proven by a write is reported as unverified, never proven.

**One URL per human action.** There is no bulk or list mode, deliberately. That
is what separates a scanner from a sweep.

**The report is not the leak.** Evidence is structural and redacted by
construction: that data returned and its shape (`1,240 rows; columns email,
stripe_id`), never the values. Keys are masked. The report renders on sites the
visitor does not own, so it must prove a hole without becoming one.

It names the issue and proves it. It does not hand out the fix.

## Running it

```bash
pnpm install
pnpm --filter @lumioguard/leakpeek-web dev    # http://127.0.0.1:5220
pnpm --filter @lumioguard/leakpeek-api dev    # http://127.0.0.1:8820
```

Or `pnpm dev` from the repo root for every tool at once.

```
POST /api/scan   { "url": "example.com" }
GET  /api/scan?url=example.com
GET  /api/health
```

## How it is built

```
core/   the engine. Isomorphic, no I/O, no network, so the suite runs offline
  passive/   what the served response reveals
  probes/    what a read-only request to the backend reveals
  scoring/   findings → score, tier, headline
  domain/    the finding shape the engine speaks
api/    Cloudflare Worker (Hono). Owns fetching, timeouts and the clock
web/    React + Vite client
```

`core` never imports from `api`, and `web` never imports `core`, which would ship
the detection logic to the browser. Anything both need is domain vocabulary and
lives in `@lumioguard/shared`.

The surface, transport and browser-side plumbing are shared with the other tools
via `@lumioguard/ui`, `@lumioguard/api-core` and `@lumioguard/web-core`.

## Configuration

| Variable | Where | Default |
|---|---|---|
| `ALLOWED_ORIGINS` | api | `*` in development |
| `LEAKPEEK_INGEST_SECRET` | api | unset (nothing is sent anywhere) |
| `LUMIOGUARD_API_BASE_URL` | api | unset (required alongside the secret) |
| `VITE_API_BASE_URL` | web | empty (Vite proxies `/api`) |
| `VITE_LUMIOGUARD_APP_URL` | web | unset (no button, no offer, no wordmark) |

All optional; see `api/.dev.vars.example` and `web/.env.example`. Leakpeek is a
complete tool with none of them set. With `VITE_LUMIOGUARD_APP_URL` unset, which
is the default, the word LumioGuard does not appear on the page at all.

The two api variables are required together: a secret without an address records
nothing, deliberately, so a fork cannot post its readings to an API it does not
own. Set all three and the report becomes the front of the
[LumioGuard](https://lumioguard.dev) funnel, where a completed reading turns into
tracked issues.

## Principles

1. **Prove it or do not claim it.** A finding is a read that returned what it
   should not, never a header that looked suspicious.
2. **Read, never write.** The engine assesses; it does not exploit.
3. **A public key is not a vulnerability.** Report what is exploitable, not what
   is merely visible.
4. **The report must not become the leak.**
