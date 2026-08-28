# Contributing

LumioGuard Tools welcomes bug fixes, detection rules, and new URL-only tools.
Before changing an engine, read that tool's README. It defines the behaviour the
code is meant to preserve.

## Set up the workspace

You need Node 22 or newer and pnpm 9 or newer.

```bash
git clone https://github.com/lumioguard-dev/lumioguard-tools.git
cd lumioguard-tools
pnpm install
pnpm dev
```

`pnpm dev` starts the console and all three Workers:

| Service | Address |
|---|---|
| Console | `http://127.0.0.1:5200` |
| Slopmeter API | `http://127.0.0.1:8810` |
| Leakpeek API | `http://127.0.0.1:8820` |
| Citecheck API | `http://127.0.0.1:8830` |

The allocations live in `ports.json`. Both the Worker launcher and Vite proxy
read that file. Do not copy its values into another config. Services bind to
`127.0.0.1` so the proxy does not depend on how a machine resolves `localhost`.

## Before opening a pull request

Run the complete gate:

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm rules:check
```

Vitest does not typecheck. A passing test suite is not enough on its own. Lint
must finish cleanly. If a Biome rule is unsuitable for the repository, change
`biome.json` with a reason instead of scattering suppressions.

`pnpm rules:check` compares `.documentation/RULES.md` with the current engines.
After adding or renaming a rule, run `pnpm rules`; never edit the catalogue by
hand.

Use `type(scope): summary` for commit subjects. Write in the imperative, keep it
lower case, and omit the trailing full stop.

## Repository map

```text
apps/console/                 the React and Vite front end
  build/                      documents generated for browsers and crawlers
  src/tools/<tool>/           a tool's client, report, theme and descriptor
packages/shared/              domain vocabulary and zod wire contracts
packages/design-tokens/       colour, typography, spacing and Tailwind output
packages/ui/                  shared React components and styles
packages/api-core/            Worker HTTP, target safety and reading hand-off
packages/web-core/            browser transport and analytics
tools/<tool>/core/            pure detection engine
tools/<tool>/api/             Cloudflare Worker around the engine
```

There is one front end. A tool contributes a surface inside the console; it does
not own another app. The console combines selected readings by taking the lowest
score, then keeps each tool's score beside its own findings.

The console must not import a tool's `core`. Doing so publishes the detector and
its rule pack in the browser bundle. Values the report needs cross the API
boundary explicitly instead of being recalculated from a second scoring table.

The engines perform no I/O. Network requests, screenshots, time, environment
access, and persistence belong to the Worker layer. Keeping `core` pure makes
fixtures deterministic and lets the suite run offline.

## Tests that belong here

Put tests beside the code in `__tests__`. Prioritise failures that would otherwise
look healthy:

- a boundary being bypassed, such as a private address reaching the fetcher;
- a product guarantee failing, such as a Leakpeek probe issuing a write;
- two representations drifting, such as score bands and chart segments;
- a realistic false positive or false negative in a detector;
- private rule data appearing in an API response.

Slopmeter has an exact parity suite for the detector it replaced. The fixture
corpus is external, so those cases run only when `SLOPMETER_PARITY_ROOT` points
to it. A mismatch means scoring changed. Do not rewrite fixtures merely to
restore green.

For interface work, verify the rendered DOM as well as screenshots. Check
overflow, collisions, contrast, and small text at narrow and wide viewports.
Exercise reduced motion and the final state of every animation.

## Adding a tool

1. Add `tools/<name>/core` and `tools/<name>/api`.
2. Allocate API and inspector ports in `ports.json`.
3. Add `apps/console/src/tools/<name>/` with its client, report, theme, and
   descriptor. Register it through that folder's `index.ts`.
4. Put its public label, slug, headline, and summary in
   `apps/console/src/tools/catalogue.ts`.
5. Add the tool to the deploy workflow's choice list.
6. Add `VITE_API_BASE_URL_<TOOL>` as a repository variable and map it to
   `VITE_<TOOL>_API_URL` during the console build.
7. Add its rules to `scripts/build-rule-catalog.mjs`, then run `pnpm rules`.

The registry drives selection, reporting, hand-off, and page lists. The
catalogue drives runtime copy and generated documents. If a new tool needs
conditionals elsewhere in the console, the abstraction has probably leaked.

## Generated documents

The console does not serve an empty `#root`. Build code writes useful HTML for
the chooser, scan page, tool pages, and explainers, using the same product copy
React renders.

| File | Responsibility |
|---|---|
| `build/documents.ts` | document assembly and escaping |
| `build/head.ts` | metadata and JSON-LD |
| `build/shell.ts` | static content inside `#root` |
| `build/pages/content.ts` | explainer copy and score ladders |
| `build/pages/render.ts` | standalone explainer documents |
| `build/tokens.ts` | build-time design tokens |
| `build/wellKnown.ts` | `robots.txt`, `sitemap.xml`, and `llms.txt` |
| `build/site.ts` | validation of `VITE_PUBLIC_SITE_URL` |
| `build/seo.ts` | Vite integration |

Do not hand-copy runtime text into HTML. Set `VITE_PUBLIC_SITE_URL` for a
production build; without it, absolute metadata is deliberately omitted.

## Local configuration

Each Worker provides `api/.dev.vars.example`. Copy it to `.dev.vars` only when
you need optional integrations. For the console, copy `.env.example` to
`.env.development.local`.

Do not use `.env.local`: Vite reads it during production builds too. Secrets
belong in `.dev.vars` locally and Cloudflare Worker secrets in production. They
never belong in `wrangler.toml` or git.

Analytics and the LumioGuard hand-off are disabled unless configured. A fork
with no keys or application URL must remain complete and must not advertise or
contact LumioGuard. Analytics must never include scanned addresses or reading
keys.

## Deployment

The deploy workflow can ship one Worker, the shared console, or both. When both
are selected, the Worker goes first because the console bundle contains each
Worker's public origin.

| Source | Cloudflare resource |
|---|---|
| `tools/<tool>/api` | `lumioguard-<tool>-api` Worker |
| `apps/console` | `lumioguard-readout` Pages project |

Production Workers need a restrictive `ALLOWED_ORIGINS` value and their
`SCAN_RATE_LIMITER` binding. CORS is not an abuse-control boundary. Run normal
deployments through GitHub Actions. Roll Workers back through Wrangler's
deployment history and Pages back by promoting an earlier deployment.

## Security while contributing

Only scan a site you own or have permission to assess. Leakpeek sends real,
read-only requests to backends discovered in public bundles.

All server-side URLs pass through `TargetResolver`, including redirect targets
and secondary resources. Leakpeek remains `GET` only, and evidence is redacted
where it is created. See [SECURITY.md](SECURITY.md) for private reporting.
