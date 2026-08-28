# Leakpeek

Leakpeek checks what a public web application exposes to someone who has only
its URL.

It reads the served document and JavaScript bundles, discovers supported backend
configuration, and makes a small set of read-only verification requests. The
result appears as one reading in the shared [Readout console](../../apps/console).

![A Leakpeek report showing an unauthenticated database read](../../assets/leakpeek.png)

## Score

The score runs from 0 to 100, with higher being better. It measures observed
exposure, not overall security.

| Tier | Score | Meaning |
|---|---|---|
| Sealed | 81-100 | Nothing obvious is leaking through the browser |
| Exposed | 61-80 | Public output reveals a secret or weak configuration |
| Cracked | 41-60 | Readable data or a live credential needs attention |
| Wide Open | 0-40 | An unauthenticated visitor can read application data |

A critical finding caps the score at 40. No collection of low-severity results
can make a readable database look less serious.

The score says only what this outside-in scan found. A score of 100 does not
certify the application, its server code, its authorization model, or paths that
require an account.

## What it checks

### Public response and bundles

- server-side or privileged keys embedded in client JavaScript;
- reachable source maps;
- missing CSP, HSTS, or X-Frame-Options headers;
- trackers running without a consent gate;
- data collection with no linked privacy policy;
- public `/.env` and `/.git/config` files, with SPA fallbacks rejected.

Secret detection includes Supabase `service_role` JWTs, Stripe live secret keys,
AWS access keys, Google API keys, OpenAI keys, and GitHub tokens. A Supabase anon
key is public by design and is not a finding by itself.

Tracker detection uses the domain a page contacts. It does not infer a tracker
from a JavaScript function name that minification might reproduce by accident.

### Read-only backend probes

When a bundle exposes a Supabase URL and anon key, Leakpeek asks discovered
tables whether they return rows without authentication. Rows returned means the
table is publicly readable, commonly because Row Level Security is absent or
ineffective.

The report records whether data came back, the row count, and column names. It
does not retain or display row values.

Open storage buckets, unauthenticated RPC, Base44 authorization bypasses, and
equivalent Firebase, PocketBase, or Appwrite rules are not probed yet. Some of
those platforms may be identified as stack information, but identification is
not proof of exposure.

The generated [rule catalogue](../../.documentation/RULES.md) lists the checks
implemented today.

## Common failures in quickly built apps

The console also shows a short reference list of problems repeatedly reported
in reviews of AI-built applications. The order reflects how often each problem
appeared in the source review, not a severity judgement:

| Reports | Problem | Reports | Problem |
|---:|---|---:|---|
| 5 | Missing Row Level Security | 5 | Secrets in frontend code |
| 4 | Admin enforced only in the UI | 3 | Records fetched by unchecked id |
| 3 | User-writable protected fields | 3 | Unbounded costly endpoints |
| 2 | Price trusted from the client | 2 | Public `.env` or `.git` files |
| 2 | Authorization trusted from local storage | 2 | Tokens not fully verified |

This reference list is broader than Leakpeek's detector. Most authorization and
account-isolation failures require source access, an account, or two test users.
The public scanner does not claim to check them.

## Safety guarantees

### Read, never write

Target probes issue `GET` only through one request primitive. Leakpeek does not
create accounts, submit forms, mutate RPCs, insert or update rows, delete data,
or write to storage. A weakness that requires a write to verify remains
unverified.

### One target per action

The product has no bulk input or sweep mode. One human submission starts one
bounded reading of one site.

### The report is not another leak

Sensitive evidence is reduced where it is produced. Keys are masked. Database
results become counts and column names before they reach mappers or the console.

These guarantees reduce impact; they do not grant permission. Only scan a site
you own or have been asked to assess.

## Run locally

Start every service:

```bash
pnpm install
pnpm dev
```

Or start Leakpeek and the console:

```bash
pnpm --filter @lumioguard/leakpeek-api dev
pnpm --filter @lumioguard/console dev
```

The console is at `http://127.0.0.1:5200`; the Worker is at
`http://127.0.0.1:8820`. Use the Leakpeek page or add `?tools=leakpeek` to the
scan URL.

```text
POST /api/scan  { "url": "example.com" }
GET  /api/health
```

## Package layout

```text
core/
  passive/      evidence already present in responses
  probes/       bounded read-only backend checks
  scoring/      findings to score, tier, and headline
  domain/       internal finding model
api/
  Cloudflare Worker responsible for fetching, timeouts, and mapping
```

The core contains no network or filesystem I/O. The console never imports it.
Shared contracts live in `@lumioguard/shared`; the report surface lives in
`apps/console/src/tools/leakpeek`.

## Configuration

| Variable | Used by | Default |
|---|---|---|
| `ALLOWED_ORIGINS` | Worker | `*` during development |
| `LEAKPEEK_INGEST_SECRET` | Worker | unset; no reading is recorded |
| `LUMIOGUARD_API_BASE_URL` | Worker | unset; required with the ingest secret |
| `VITE_LEAKPEEK_API_URL` | Console | relative local proxy |
| `VITE_LUMIOGUARD_APP_URL` | Console | unset; no hand-off or branding |
| `VITE_POSTHOG_KEY` | Console | unset; analytics disabled |

All variables are optional for local use. See `api/.dev.vars.example` and
`../../apps/console/.env.example`.

The ingest address and secret are required together. Partial configuration
records nothing, preventing a fork from sending unsigned readings to a service
it does not own.

## Principles

1. Prove exposure with a read or label it unverified.
2. Do not call a public client key a vulnerability.
3. Redact evidence before it crosses a boundary.
4. Prefer a missed finding to a confident false accusation.
