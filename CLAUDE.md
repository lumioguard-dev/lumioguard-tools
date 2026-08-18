# Working in this repo

Two tools share this repo, and each `README.md` is the authority on what it is,
what is merely planned, and what has been retired. Read the relevant one before
changing behaviour, and update it in the same change when behaviour moves.

- **Slopmeter** reads a web page and scores how closely its choices match the
  defaults that generated sites ship with. See `tools/slopmeter/README.md`.
- **Leakpeek** reads a URL and reports what the app is exposing — keys in the
  bundle, a database with no row-level security, files served from the root. See
  `tools/leakpeek/README.md`.

## Layout

```
packages/shared          wire contracts + shared domain vocabulary (zod)
packages/design-tokens   colour, type, radii, elevation → Tailwind plugin
tools/<tool>/core        detection engine. No I/O.
tools/<tool>/api         Cloudflare Worker over hono
tools/<tool>/web         React + Vite client
```

Both tools take that same three-package shape under `tools/` and draw on the two
shared packages. They do not depend on each other: a type
both engines need belongs in `shared`, never imported across tools.

Dependencies point one way: `web` and `api` depend on `shared`; `api` also
depends on `core`; `core` depends only on `shared`. **`web` must never import
`core`** — that would ship Slopmeter's 113 rules, or Leakpeek's detection logic,
to the browser. Anything both the engine and the surface need is domain
vocabulary and belongs in `shared`.

`core` is isomorphic and does no I/O. Fetching, screenshots and time belong to
`api` services; keep them out of the engine so the suite runs without a network.

## Structure

Within a package, group by what the code is for, not by what kind of file it is.

- `web/ui/` — primitives any surface could use. `web/features/<feature>/` — a
  feature's components, hooks and types together. `web/theme/` — the mapping
  from product vocabulary to tokens.
- `api/http/` — transport concerns. `api/services/` — one job each.
  `api/mappers/` — domain → DTO. `api/container.ts` — the only place that wires
  them, built once per isolate.
- `core/domain/`, `core/rules/`, `core/analysis/`, `core/scoring/`, `core/crawl/`
  in Slopmeter; `core/domain/`, `core/passive/`, `core/probes/`, `core/scoring/`
  in Leakpeek, where the split that matters is what a read costs the target.

A file named after a plural (`Panels.tsx`, `utils.ts`) usually means the folder
should have taken the split instead.

## TypeScript

- `strict` with `noUncheckedIndexedAccess`. Indexed access yields `T | undefined`
  — handle it, don't assert it away.
- **No casts to escape a type.** `as unknown as X` is always a defect; so is a
  lone `as X` used to silence an error. Reach for a narrowing helper (see
  `shared/contracts/zod.ts`) or fix the type.
- Prefer a `Record<Union, T>` over a `switch` or `Record<string, T>` — an added
  union member then fails to compile instead of returning `undefined` at
  runtime.
- Constants that are also types use the object-plus-type idiom
  (`export const Tier = {...} as const; export type Tier = ...`), not `enum`.
- Props and public fields are `readonly`. Exported functions carry explicit
  return types.
- Validate at the boundary and never below it: `ScanClient` parses every response
  through its schema so a wire change fails there rather than as `undefined`
  three components deep.

## Classes vs functions

Use a class when there is state or an injectable collaborator: `TierResolver`,
`ScanService`, `SiteCrawler`, `ScanClient`. Constructor-inject dependencies with
a default, so tests can swap them and production needs no wiring at the call
site. Never reach for a singleton or module-level mutable state; `container.ts`
is the one composition root.

Use a plain function when the thing is a pure transformation (`bandTrack`,
`weightInk`) and a React component when it renders. Don't wrap a pure function in
a class for symmetry.

## Single source of truth

The tier ladder is the worked example. It once lived twice — ceilings in the
engine, spans in the chart — so retuning a threshold in one place left the other
misreporting where a score fell. It now lives once in `shared/domain/tier.ts`,
the wire enum is generated from it, and a test asserts the bands are contiguous
and fill the track exactly once.

Before adding a constant, grep for its value. Two literals that must agree and
cannot fail together are a bug that has not happened yet.

## Comments

**Default to none. One to three lines when you must.**

A comment earns its place only by carrying something the code cannot: why a
threshold is that number, what broke that led to this shape, a security
guarantee, a constraint a future editor would otherwise undo. `autoComplete="off"`
on the address field carries such a note — without it the browser's saved-address
dropdown swallows Enter and scans an unrelated site. That is the whole comment.

Cut: anything restating the line beneath it, banner comments, commented-out code,
and narration of what a function does step by step. If a comment exists only
because the code is unclear, rename things instead.

A long comment is a summarise-and-cut job, not a keep-everything job: preserve the
invariant, delete the story around it. Prose blocks explaining a design decision
belong in the tool's `README.md`, not above the function.

## Design

Tokens are the only source of colour, type and spacing — no hex literals in
components. Every colour token is a `var()` pointing at a custom property that
`packages/design-tokens` emits per theme, which is what lets an inline style
follow the theme without the component knowing a theme exists.

Because they are `var()` strings, **never do arithmetic on a token**. Appending
hex alpha (`${ink}16`) silently produces `var(--x)16` and paints nothing; use
`color-mix(in srgb, ${ink} 9%, transparent)`. Light is the default and dark is
reached by an explicit choice written to the document, never by the operating
system. The visual world is a ballpoint hand on dark paper: drawn frames
with uneven per-corner radii cycled across four "hands", so no two neighbouring
boxes close the same way. A single uniform rounded rectangle everywhere reads as
a component library, which is the exact thing this tool exists to detect.

Both alternatives have now been tried on the page and rejected: one even radius
on every frame, and true right angles. Each was built, looked at and reverted on
2026-08-17. **The drawn frame is the decision** — treat a proposal to regularise
it as already answered.

`drawn.*` remains in `packages/design-tokens` because `leakpeek` still builds on
it. It is that tool's language now; reaching for it in `tools/slopmeter/web` is
reverting this decision.

Motion is an enhancement; the reading is not. Animations pause in a backgrounded
tab, so never await `animation.finished` alone — race it against a timeout and
make sure every path lands the final state. Honour
`prefers-reduced-motion`. The no-script render must already be correct.

## Security boundary

- **The rule pack is the product.** Rule ids, categories and the catalogue never
  go on the wire, and there is no route that returns them. `api/__tests__/
  wire-boundary.test.ts` exists because this boundary is invisible: nothing
  breaks and no screen looks wrong if a mapper spreads the domain object onto
  the response.
- Errors from internals are answered generically; their messages carry file
  paths and rule source.
- Secrets never enter git. `.deploy.env` holds a live Cloudflare token and the
  ignore list covers every env shape — check before adding a new one.

## Copy

Copy that gets assembled has rules the compiler cannot see, so they are tests.
Rule `phrase`es are joined three at a time into one sentence, which means none
may end in a full stop, read as a sentence, or contain a comma — a comma
collides with the commas doing the joining and the line stops parsing. See
`tools/slopmeter/core/__tests__/headline.test.ts`.

**A number in prose must come from the constant it describes.** The button once
promised "up to 40 pages, four clicks deep" while the client sent no options at
all, so every read ran the defaults of 15 and two: those were the ceilings the
API would accept, not what it did. Either interpolate the constant or describe
the shape of the thing rather than its dimensions. A number nobody asked for is
a number that can be wrong.

## Verifying

Run before calling anything done:

```
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

`core`'s parity suite re-scores 120 cached pages and requires **exact** matches.
It is the safety net for any engine change: if it drifts, the change altered
scoring, whether or not that was the intent. Never retune the fixtures to make it
pass.

Lint must be clean, not merely quieter. If a rule is wrong for this codebase,
turn it off in `biome.json` with a reason (as with Tailwind's `theme()` in CSS)
rather than scattering suppressions.

For UI work, measure rather than trust a screenshot: check for overflow, text
under 12px, contrast and collisions in the live DOM. Measure the *rendered*
result, not the intent — a rotated element's bounding box is wider than the
element, and sizing type off it put an arc of the seal under the 12px floor
while the arithmetic looked right.

Animation needs the same treatment, sampled frame by frame. Two defects this
caught that reading the code did not: a needle running to -18.9%, off the end of
its own track, because its resting place and the offsets animating it were
measured against different origins; and an empty grid item still claiming its
row gap, putting 28px of nothing above a meter. Anchor positions as percentages
where an element must survive its container resizing, and carry any offset
across such a change as a fraction rather than in pixels.

## Open source

This repo is public. Two consequences that bite:

- **The LumioGuard integration is OPTIONAL and off by default.** No ingest
  secret, no app URL, no hand-off button. A fork must never advertise something
  it does not have, so nothing here may hard-code a LumioGuard address.
- **Nothing may depend on a path outside the repo.** The parity corpus lives
  elsewhere and its suite skips itself unless `SLOPMETER_PARITY_ROOT` is set.

## Commits

Conventional prefixes (`feat`, `fix`, `refactor`, `chore`, `docs`) scoped to the
package. The body says *why*, and names the failure the change prevents where
there is one. One logical change per commit.
