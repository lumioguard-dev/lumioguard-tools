# Contributing

Thanks for looking. Bug reports, new detection rules and whole new tools are all
welcome.

## Getting set up

Node 22+ and pnpm 9+.

```bash
git clone https://github.com/lumiostack/lumioguard-tools.git
cd lumioguard-tools
pnpm install
pnpm dev
```

`pnpm dev` starts every tool's web app and Worker at once. Ports are in the table
below.

## Before you open a pull request

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

All four must pass. Lint must be *clean*, not merely quieter. If a rule is wrong
for this codebase, turn it off in `biome.json` with a reason rather than
scattering suppressions.

Commits use conventional prefixes (`feat`, `fix`, `refactor`, `chore`, `docs`)
scoped to the package, and the body says *why*. One logical change per commit.

## How the code is arranged

```
apps/
  console/           the one front end. React + Vite
    src/tools/<tool>/  that tool's client, report panels, ink and descriptor
    src/tools/registry.ts  what a tool must provide to appear in the console
packages/            what every tool shares
  shared/            wire contracts (zod) and domain vocabulary
  design-tokens/     colour, type, spacing, radii → a Tailwind plugin
  ui/                the drawn surface: components, theme, stylesheet
  api-core/          transport and target resolution for a tool's Worker
  web-core/          browser-side transport and scan state
tools/<tool>/
  core/              the detection engine. Isomorphic, no I/O
  api/               Cloudflare Worker (Hono)
```

**A tool has no front end of its own.** There is one app, and every tool's
surface is a folder inside it. Three meters on one page ask the reader which
number is the answer, so the console draws a single verdict, the worst of the
readings that ran, and each tool's own score sits with its own section.

Dependencies point one way. The console and `api` depend on `shared`; `api` also
depends on `core`; `core` depends only on `shared`.

**The console must never import `core`.** That would ship the whole rule pack to
the browser, where anyone can read it. Anything both the engine and the surface
need is domain vocabulary and belongs in `shared`. A weight the surface has to
rank findings by is put on the WIRE by the mapper rather than recomputed in the
client, so there is never a second copy of a scorer's table.

**`core` does no I/O.** Fetching, screenshots and the clock live in `api`
services. That is what lets the engines be tested against fixtures with no
network, and it is not negotiable: a `fetch` in `core` breaks the whole suite's
offline guarantee.

Within a package, group by what the code is *for*, not by what kind of file it
is. A file named after a plural (`utils.ts`, `Panels.tsx`) usually means the
folder should have taken the split instead.

## Ports are allocated, not defaulted

More than one tool is expected to run at once, so ports come out of a table
rather than from whatever Vite finds free.

| Range | Owner |
|---|---|
| `5173`, `8787` | Reserved for the LumioGuard app and its API. Never take these. |
| `9229` | wrangler's default inspector port. Reserved, and the reason for the third column. |
| `52xx` | apps |
| `88xx` | tool Workers |
| `98xx` | tool Worker inspectors |

| Service | Port | Inspector |
|---|---|---|
| console | `5200` | |
| slopmeter api | `8810` | `9810` |
| leakpeek api | `8820` | `9820` |
| citecheck api | `8830` | `9830` |

**Every Worker needs its own inspector port.** `wrangler dev` defaults all of
them to `9229`, so the second to start fails to bind it and exits, taking the
whole `pnpm dev` down. Three tools running at once is the normal case here, and
the symptom is the one hardest to read: the console loads, one tool answers, the
others return `502`, and the real cause is a socket error in a runtime stack
trace nobody scrolls to. `scripts/dev-worker.mjs` passes `--inspector-port` from
the same row as `--port`.

A tool no longer serves a page of its own. There is one app, the console, and
it proxies `/<tool>/api` to that tool's Worker.

`ports.json` is the single source of truth. The console's `vite.config.ts` and
`scripts/dev-worker.mjs` both read it, so a tool's number cannot drift apart
from the proxy pointed at it, and `scripts/ports.mjs` fails loudly if two owners
claim one port.

Vite's fallback behaviour is why this is a table: it takes the next free port and
prints it, so a collision surfaces as a proxy pointing at whatever answered
rather than as an error.

Everything binds **`127.0.0.1`, never `localhost`**. On a machine that resolves
`localhost` to `::1` first, the proxy dials an address the Worker is not
listening on and every request fails with nothing in the Worker's log.

## Testing

Tests live beside what they cover, in a `__tests__` folder. They run on Node
with no DOM and no network, which is what keeps the whole suite a few seconds.

What is worth a test here is narrower than "everything", and wider than "the
happy path". The ones that earn their place guard something that would fail
**silently**:

- **A boundary.** `TargetResolver` refusing a private address, the error mapper
  answering generically, `ApiClient` rejecting a body that is the wrong shape.
  Break one of these and nothing on screen looks wrong.
- **A promise the product makes.** Leakpeek's prober only ever issuing `GET`;
  a critical finding pinning the score into the top band; the rule pack staying
  off the wire.
- **Two things that must agree.** A colour token and the custom property it
  points at; the critical floor and the band it names. Assert them against each
  other, never against a copy of the number.

A test that restates the implementation is worse than no test: it fails when the
code is refactored and passes when the behaviour is wrong.

### The UI is measured, not mocked

There are no jsdom or component tests, deliberately. A component that renders
without throwing tells you almost nothing about a report whose whole job is to
be read and believed, and the defects that actually shipped here were an arc of
type under the 12px floor and a needle running to -18.9%, off the end of its own
track. Neither would fail a render test.

UI is checked in a real browser against the live DOM: overflow, contrast,
collisions, and the *rendered* box rather than the intended one, because a
rotated element's bounding box is wider than the element. Animation is sampled frame by
frame. What is unit-tested is the pure logic underneath: the band maths, the
token contract, the scale each verdict is drawn against.

### The parity suite

`slopmeter/core` carries a suite that re-scores a cached corpus and requires
**exact** matches. That corpus is not in this repository, so it skips itself
unless `SLOPMETER_PARITY_ROOT` points at a checkout of it.

Where it runs, it is the safety net for any engine change: if it drifts, the
change altered scoring, whether or not that was the intent. Never retune the
fixtures to make it pass.

## Adding a tool

1. Create `tools/<name>/{core,api,web}`. The workspace globs pick it up with no
   config edit. Its `web` is a surface library, not an app: a client, a report
   component and its ink, exported from `src/index.ts`.
2. Claim the next free api slot in `ports.json`. The console proxies
   `/<name>/api` to it with no edit anywhere.
3. Add a descriptor in `apps/console/src/tools/` and a line in that folder's
   `index.ts`. That is the whole surface change: the picker, the consolidated
   score, the hand-off and the report all read that array.
4. Add the tool to the `tool` choice list in `.github/workflows/deploy.yml`.
5. Add `VITE_API_BASE_URL_<TOOL>` as a repository variable and map it to the
   console's `VITE_<NAME>_API_URL` in the console build step.

## Deploying

Each tool owns its own Worker and ships on its own, so releasing one never
touches a sibling. That independence is why the repo is laid out by tool rather
than by layer. There is **one** Pages project, because there is one app.

| Part | Cloudflare resource | Name |
|---|---|---|
| `tools/<tool>/api` | Worker | `lumioguard-<tool>-api` |
| `apps/console` | Pages | `lumioguard-readout` |

**One-time.** Workers are created by `wrangler deploy` on first run; Pages
projects are not:

```bash
pnpm dlx wrangler pages project create lumioguard-readout --production-branch main
```

Then set two repository secrets, `CLOUDFLARE_API_TOKEN` (with *Workers Scripts:
Edit* and *Pages: Edit*) and `CLOUDFLARE_ACCOUNT_ID`, plus one variable per tool,
`VITE_API_BASE_URL_<TOOL>`, holding that tool's deployed Worker origin.

Those matter. In development the console proxies `/<tool>/api` to the local
Worker, so the client uses a relative path. In production the Pages site and the
Workers are **different origins**, and each is baked into the bundle at build
time. Set one wrong and that tool's reading fails CORS with no useful error
**while the other tools carry on**, which is easy to miss. Point each Worker's
`ALLOWED_ORIGINS` at its Pages URL rather than leaving `*` in production.

**Shipping.** GitHub → Actions → **Deploy** → Run workflow; pick the tool and
whether to ship `api`, `web` or `both`. It typechecks, lints and runs the suite
first, because a deploy that skips the suite ships the regression the suite
exists to catch. Order within a tool is deliberate: **api first**, because the web bundle
is built against the Worker's origin.

**Rollback.** Workers and Pages both keep deployment history:

```bash
pnpm dlx wrangler deployments list --name lumioguard-<tool>-api
pnpm dlx wrangler rollback --name lumioguard-<tool>-api
```

Pages rollback is done from the dashboard: pick a previous deployment and promote
it to production.

## Local environment files

Copy each tool's `api/.dev.vars.example` → `.dev.vars`, and
`apps/console/.env.example` → `apps/console/.env.development.local`. Both are
gitignored, and every variable in them is optional.

Use `.env.development.local`, **not** `.env.local`: Vite reads `.env.local` in
every mode including `vite build`, so local values in it would ship in a laptop
deploy. The `.development` infix keeps them out of a production build.

Secrets never enter git. In production they are Worker secrets
(`wrangler secret put NAME`), never values in `wrangler.toml`.

## A few house rules

- **No casts to escape a type.** `as unknown as X` is always a defect, and so is
  a lone `as X` used to silence an error. Narrow properly or fix the type.
- **Before adding a constant, grep for its value.** Two literals that must agree
  and cannot fail together are a bug that has not happened yet.
- **Comments default to none.** One earns its place only by carrying what the
  code cannot: why a threshold is that number, what broke that led to this shape,
  a guarantee a future editor would otherwise undo. Design decisions belong in a
  README, not above a function.
- **No hard-coded LumioGuard address.** The integration is optional and off by
  default; a fork must never advertise or reach something it does not have.
