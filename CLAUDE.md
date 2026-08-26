# Working in this repo

This file is for anyone changing the code, human or agent. It records the
decisions that are expensive to rediscover: the invariants, and the failures that
put them there.

It is not the contributor guide. Setup, ports, testing and deploying live in
[CONTRIBUTING.md](CONTRIBUTING.md). What each tool does, and deliberately does
not do, lives in that tool's `README.md`, which is the authority on its
behaviour. Read the relevant one before changing behaviour, and update it in the
same change when behaviour moves.

- **Slopmeter** scores how closely a site's choices match the defaults generated
  sites ship with. See `tools/slopmeter/README.md`.
- **Leakpeek** reports what an app is exposing: keys in the bundle, a database
  with no row-level security, files served from the web root. See
  `tools/leakpeek/README.md`.
- **Citecheck** reports what stops a page being quoted by an answer engine: a
  body that is empty without JavaScript, crawlers turned away, no machine
  readable claims, nothing an answer can be lifted from. See
  `tools/citecheck/README.md`.

## The six that must not break

Everything else in this file is guidance. These six are the ones where breaking
them looks like nothing is wrong.

1. **The console never imports `core`.** That ships a whole detection engine to
   the browser, where anyone can read it. Anything both the engine and the
   surface need is domain vocabulary and belongs in `shared`. Where the surface
   needs a number the scorer owns, such as what a finding cost, the mapper puts
   it on the WIRE rather than the client recomputing it from a second copy of
   the table.
2. **`core` does no I/O.** No `fetch`, no filesystem, no clock. Fetching,
   screenshots and time belong to `api` services. This is what lets the suite run
   offline in seconds.
3. **The rule pack does not cross the wire.** Rule ids, categories and the
   catalogue never appear in a response, and no route returns them.
   `api/__tests__/wire-boundary.test.ts` exists because nothing breaks and no
   screen looks wrong when this leaks.
4. **Leakpeek reads, never writes.** `GET` only, through one request primitive,
   with no code path that writes. A finding that could only be proven by writing
   is reported unverified, never proven. The line between assessing a hole and
   exploiting one is the line between a read and a write.
5. **A report must not become the leak.** Evidence is redacted where it is
   produced: row counts and column names, never values; keys masked. Reports
   render on sites the reader does not own.
6. **The console serves a real document.** `#root` is filled at build time with
   the home page's own words, taken from `src/copy.ts` and the tool catalogue.
   Served empty it is `access.shell`, the blocker Citecheck ships in this repo,
   and the app looks perfect to every human who visits while scoring 40 on
   itself. Never hand-write that copy into `index.html`, and never hide the
   static document from anything that runs JavaScript: serving one thing to a
   browser and another to a crawler is the cloaking these tools report.

## Layout

```
apps/console                    the one front end
  build/                        what a crawler is served, written at build time
  build/pages/                  the prerendered explainers, one document each
  src/copy.ts                   the app's own words, read by the app and the build
  src/pages.ts                  the explainers, registered for the app and the build
  src/tools/catalogue.ts        each tool's id, label and summary as plain data
  src/tools/registry.ts         what a tool must provide to appear
  src/tools/<tool>/             its client, report panels, ink and descriptor
packages/shared                 wire contracts (zod) and shared domain vocabulary
packages/design-tokens          colour, type, radii, elevation, as a Tailwind plugin
packages/ui                     the drawn surface: components, theme, stylesheet
packages/api-core               transport, target resolution, reading hand-off
packages/web-core               browser-side transport and scan state
tools/<tool>/core               detection engine. No I/O
tools/<tool>/api                Cloudflare Worker over hono
```

Every tool is an engine and a Worker, and draws on the shared packages. They do
not depend on each other: a type both engines need belongs in `shared`, never
imported across tools.

Dependencies point one way. The console and `api` depend on `shared`; `api` also
depends on `core`; `core` depends only on `shared`.

**There is one front end, and a tool has none of its own.** Three meters on one
page ask the reader which number is the answer. The console draws one verdict,
the **worst** of the readings that ran, and each tool's own score sits with its
own section in that tool's own words.

A tool is added to the surface by a folder under `apps/console/src/tools/` and a
line in that folder's `index.ts`. Nothing else in the console names a tool, so
the picker, the consolidated score, the hand-off and the report all learn about
it at once. A tool that crawls also hands back its pages, and every crawl is
merged into ONE page list rather than a door each.

Adding a third tool should be a folder, not a rewrite. When something is written
twice, once per tool, that is the signal it belongs in a shared package. The
reading hand-off used to live in both and the two copies were the signing code,
where a correction to one could silently miss the other.

## Structure

Group by what the code is for, not by what kind of file it is.

- `web/features/<feature>/`: a feature's components, hooks and types together.
  `web/theme/`: the mapping from product vocabulary to tokens.
- `api/http/`: transport. `api/services/`: one job each. `api/mappers/`: domain
  to DTO. `api/container.ts`: the only place that wires them, built once per
  isolate.
- `core/` splits by what the work costs. In Leakpeek that is `passive/` against
  `probes/`, because one reads what was already served and the other touches
  someone else's backend.

A file named after a plural (`Panels.tsx`, `utils.ts`) usually means the folder
should have taken the split instead.

## TypeScript

- `strict` with `noUncheckedIndexedAccess`. An indexed read yields
  `T | undefined`. Handle it; do not assert it away.
- **No casts to escape a type.** `as unknown as X` is always a defect, and so is
  a lone `as X` used to silence an error. Narrow properly, or fix the type.
  Interfaces have no implicit index signature, so an interface will not satisfy
  `Record<string, unknown>`; a type alias will, and that is usually the real fix
  rather than a cast.
- Prefer `Record<Union, T>` over a `switch` or `Record<string, T>`, so an added
  union member fails to compile instead of returning `undefined` at runtime.
- Constants that are also types use the object-plus-type idiom
  (`export const Tier = {...} as const; export type Tier = ...`), not `enum`.
- Props and public fields are `readonly`. Exported functions carry explicit
  return types.
- Validate at the boundary and never below it. `ScanClient` parses every response
  through its schema, so a wire change fails there rather than as `undefined`
  three components deep.

## Classes vs functions

Use a class when there is state or an injectable collaborator: `ScanService`,
`SiteCrawler`, `ReadingRecorder`, `ScanClient`. Constructor-inject dependencies
with a default, so tests can swap them and production needs no wiring at the call
site. Never reach for a singleton or module-level mutable state; `container.ts`
is the one composition root.

Use a plain function for a pure transformation, and a React component when it
renders. Do not wrap a pure function in a class for symmetry.

## Single source of truth

Before adding a constant, grep for its value. **Two literals that must agree and
cannot fail together are a bug that has not happened yet.**

Two worked examples, both of which shipped:

- The tier ladder lived twice, ceilings in the engine and spans in the chart, so
  retuning a threshold in one place left the other misreporting where a score
  fell. It now lives once and a test asserts the bands are contiguous and fill
  the track exactly once.
- Leakpeek's critical floor was written in the scorer and again as the top band's
  lower bound. Retuning the ladder would have moved the band and left the floor
  behind, landing a critical finding a tier below the one the README promises.
  It is now derived from the band.

## Comments

**Default to none. One to three lines when you must.**

A comment earns its place only by carrying what the code cannot: why a threshold
is that number, what broke that led to this shape, a guarantee a future editor
would otherwise undo. `autoComplete="off"` on the address field carries such a
note, because without it the browser's saved-address dropdown swallows Enter and
scans an unrelated site. That is the whole comment.

Cut anything restating the line beneath it, banner comments, commented-out code,
and step-by-step narration. If a comment exists only because the code is unclear,
rename things instead.

A long comment is a summarise-and-cut job, not a keep-everything job: preserve
the invariant, delete the story around it. Prose explaining a design decision
belongs in a `README.md`.

**THREE LINES IS THE CEILING, not a target.** A block longer than that is a
defect, whatever it says. The rule is mechanical on purpose: the alternative,
"as long as it needs to be", is how a file ends up carrying more prose than
code and how the one load-bearing sentence gets lost in the retelling around
it. If three lines cannot hold it, the rest belongs in a `README.md` and the
comment points there.

## Writing

This applies to every word that ships: documentation, comments, commit messages,
UI copy, issue and PR templates.

- **No em dashes.** Not in prose, not in comments, not in commit messages. Use a
  comma, a colon, a semicolon, brackets, or two sentences, whichever the sentence
  actually wants. An em dash is usually a sentence that has not decided what it
  is. En dashes stay where they belong, in numeric ranges like `0-19`.
- **A number in prose must come from the constant it describes**, or not appear.
  The button once promised "up to 40 pages, four clicks deep" while the client
  sent no options at all, so every read ran the defaults of 15 and two. Those
  were the ceilings the API would accept, not what it did. Interpolate the
  constant, or describe the shape of the thing rather than its dimensions. A
  number nobody asked for is a number that can be wrong.
- Copy that gets assembled has rules the compiler cannot see, so they are tests.
  Rule `phrase`es are joined three at a time into one sentence, so none may end
  in a full stop, read as a sentence, or contain a comma. A comma collides with
  the commas doing the joining and the line stops parsing. See
  `tools/slopmeter/core/src/__tests__/headline.test.ts`.

## Design

Tokens are the only source of colour, type and spacing. No hex literals in
components. Every colour token is a `var()` pointing at a custom property that
`packages/design-tokens` emits per theme, which is what lets an inline style
follow the theme without the component knowing a theme exists.

Because they are `var()` strings, **never do arithmetic on a token**. Appending
hex alpha (`${ink}16`) silently produces `var(--x)16` and paints nothing. Use
`color-mix(in srgb, ${ink} 9%, transparent)`.

Light is the default. Dark is reached by an explicit choice written to the
document, never by the operating system.

The visual world is a ballpoint hand on paper: drawn frames with uneven
per-corner radii cycled across four "hands", so no two neighbouring boxes close
the same way. A single uniform rounded rectangle everywhere reads as a component
library, which is the exact thing Slopmeter exists to detect.

**The h1 is the one exception, set in Archivo.** It is the first thing read and
the hand was hard to read at 48px. Everything else keeps the hand.

**The drawn frame is a settled decision.** Both alternatives were built, looked
at, and reverted on 2026-08-17: one even radius on every frame, and true right
angles. Treat a proposal to regularise it as already answered.

Motion is an enhancement; the reading is not. Animations pause in a backgrounded
tab, so never await `animation.finished` alone. Race it against a timeout and
make sure every path lands the final state. Honour `prefers-reduced-motion`. The
no-script render must already be correct.

## Security

Beyond the six invariants above:

- Errors from internals are answered generically. Their messages carry file paths
  and rule source.
- Anything reading a secret **fails closed**. An unset ingest secret means no
  reading is sent, never an unsigned one. Recording needs both a secret and an
  address, so a fork that sets one cannot post to an API it does not own.
- Signatures cover a timestamp as well as the body, and stale ones are refused.
  A body-only signature never expires, so a captured request could be replayed
  forever.
- Server-side fetches go through `TargetResolver`, which refuses private ranges,
  loopback, cloud metadata addresses and non-web schemes. Without it a public
  scanner becomes a probe for whatever sits next to it on the network.
- Secrets never enter git. `.deploy.env` holds a live Cloudflare token, and the
  ignore list covers every env shape. Check before adding a new one.

## Verifying

Run before calling anything done:

```
pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm rules:check
```

A green test run is not a green gate. Vitest does not typecheck, so a test can
pass against a fixture whose shape the compiler would reject.

`rules:check` regenerates `docs/RULES.md` in memory and fails when it differs
from the committed file. Adding a rule without running `pnpm rules` leaves the
catalogue quietly describing an engine that has moved on.

Lint must be clean, not merely quieter. If a rule is wrong for this codebase,
turn it off in `biome.json` with a reason rather than scattering suppressions.
A single justified exception is a `biome-ignore` naming why.

Slopmeter's parity suite re-scores a cached corpus and requires **exact**
matches. If it drifts, the change altered scoring, whether or not that was the
intent. Never retune the fixtures to make it pass.

For UI, measure rather than trust a screenshot: overflow, text under 12px,
contrast and collisions, in the live DOM. Measure the *rendered* result, not the
intent. A rotated element's bounding box is wider than the element, and sizing
type off it put an arc of the seal under the 12px floor while the arithmetic
looked right.

Animation needs the same treatment, sampled frame by frame. Two defects this
caught that reading the code did not: a needle running to -18.9%, off the end of
its own track, because its resting place and the offsets animating it were
measured against different origins; and an empty grid item still claiming its row
gap, putting 28px of nothing above a meter. Anchor positions as percentages where
an element must survive its container resizing, and carry any offset across such
a change as a fraction rather than in pixels.

## This repo is open source

The consequences that bite:

- **The LumioGuard integration is optional and off by default.** No ingest
  secret, no app URL, no hand-off button, and no mention of the name anywhere on
  the page. A fork must never advertise something it does not have, so nothing
  here may hard-code a LumioGuard address.
- **The hand-off carries every key in ONE parameter, joined by `_`.** A reading
  runs several tools and each API mints its own key. Repeating the parameter was
  tried: the app parses its search with zod, where `sitekey` is a string, so
  `?sitekey=A&sitekey=B` arrived as an ARRAY and threw before any route matched.
  The whole app rendered a blank page, which is not the graceful degrade it was
  assumed to be. `_` is safe because the key alphabet excludes it, so a joined
  value can only split one way. ORDER IS MEANING: the worst reading goes first,
  and the far side lands the visitor on that tool's area while importing the
  rest beside it.
- **Nothing may depend on a path outside the repo.** The parity corpus lives
  elsewhere and its suite skips itself unless `SLOPMETER_PARITY_ROOT` is set.

Assume a stranger is reading. Anything that only makes sense with context you
happen to have is a comment that needs writing or a name that needs changing.

## Commits

**One line. No body.** `type(scope): summary`, conventional prefix (`feat`,
`fix`, `refactor`, `chore`, `docs`), imperative, lower case, no trailing full
stop. The subject IS the message; the diff and the pull request carry the
detail. Trailers are the only exception.

**One commit per branch.** Squash before merging. A branch is one change, and
its history of false starts is not something master needs to carry.

## Versions

The repo ships as ONE version across every package, in semantic versioning.

**A release bumps the MINOR.** `0.1.5` to `0.2.0`, never `0.1.6`. Patch is
reserved for a fix shipped on its own against an already-released version, and
major waits for a deliberate break. Picking minor by default keeps the number
honest: almost every release here carries a behaviour change somewhere, and a
patch bump would understate it.

The Release workflow tags the current version, then bumps for the next cycle.
The version is never edited by hand: `scripts/set-monorepo-version.mjs` writes
every workspace package at once, because a version that lives in twelve files
is a version that disagrees with itself.
