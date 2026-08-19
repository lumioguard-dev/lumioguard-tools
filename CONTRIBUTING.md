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
packages/            what every tool shares
  shared/            wire contracts (zod) and domain vocabulary
  design-tokens/     colour, type, spacing, radii → a Tailwind plugin
  ui/                the drawn surface: components, theme, stylesheet
  api-core/          transport and target resolution for a tool's Worker
  web-core/          browser-side transport and scan state
tools/<tool>/
  core/              the detection engine. Isomorphic, no I/O
  api/               Cloudflare Worker (Hono)
  web/               React + Vite client
```

Dependencies point one way. `web` and `api` depend on `shared`; `api` also
depends on `core`; `core` depends only on `shared`.

**`web` must never import `core`.** That would ship the whole rule pack to the
browser, where anyone can read it. Anything both the engine and the surface need
is domain vocabulary and belongs in `shared`.

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
| `52xx` | tool web apps |
| `88xx` | tool Workers |

| Tool | Web | Worker |
|---|---|---|
| slopmeter | `5210` | `8810` |
| leakpeek | `5220` | `8820` |

`ports.json` is the single source of truth. `vite.config.ts` and
`scripts/dev-worker.mjs` both read it, so a tool's two numbers cannot drift
apart, and `scripts/ports.mjs` fails loudly if two owners claim one port.

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
   config edit.
2. Claim the next free slot in `ports.json`.
3. Add the tool to the `tool` choice list in `.github/workflows/deploy.yml`.
4. Add `VITE_API_BASE_URL_<TOOL>` as a repository variable and reference it in
   the web build step.
5. Create its Pages project (below).

## Deploying

Each tool owns its own Worker and Pages project and ships on its own, so
releasing one never touches a sibling. That independence is why the repo is laid out by
tool rather than by layer.

| Part | Cloudflare resource | Name |
|---|---|---|
| `tools/<tool>/api` | Worker | `lumioguard-<tool>-api` |
| `tools/<tool>/web` | Pages | `lumioguard-<tool>-web` |

**One-time.** Workers are created by `wrangler deploy` on first run; Pages
projects are not:

```bash
pnpm dlx wrangler pages project create lumioguard-<tool>-web --production-branch main
```

Then set two repository secrets, `CLOUDFLARE_API_TOKEN` (with *Workers Scripts:
Edit* and *Pages: Edit*) and `CLOUDFLARE_ACCOUNT_ID`, plus one variable per tool,
`VITE_API_BASE_URL_<TOOL>`, holding the deployed Worker's origin.

That last one matters. In development Vite proxies `/api` to the local Worker, so
the client uses a relative path. In production the Pages site and the Worker are
**different origins**, and the origin is baked into the bundle at build time. Set
it wrong and every scan fails CORS with no useful error. Point each Worker's
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

Copy `api/.dev.vars.example` → `.dev.vars` and `web/.env.example` →
`.env.development.local`. Both are gitignored, and every variable in them is
optional.

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
