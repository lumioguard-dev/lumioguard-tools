# Changelog

Notable changes to both tools. Dates are the release date.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project uses [semantic versioning](https://semver.org/spec/v2.0.0.html).
Both tools share the repository's version number, so a release names whatever
moved in either.

**A changed score is a breaking change.** A rule whose weight moves, or a new
rule that fires, changes the number a site was given yesterday. Those are called
out under Changed rather than buried in Fixed, because someone may have written
the old number down.

## [Unreleased]

### Added

- **Citecheck**, a third tool: what stops an answer engine reading a site and
  quoting it. Empty-without-JavaScript pages, crawlers turned away, no
  machine-readable claims, nothing an answer could be lifted from.
- **Readout**, one front end over all three tools. Pick which readings to run,
  paste an address, and they run at once under a single verdict. Each tool's
  `web` package is gone: a tool has no page of its own now, its surface is a
  folder inside the console.

- `SECURITY.md`: how to report a flaw in the tools privately, what each tool
  does to a site it reads, and the line on scanning only what you own.
- `CODE_OF_CONDUCT.md`, issue templates for bugs and detection proposals, and a
  pull request template.
- Dependabot, with what ships kept in a separate group from build tooling.

### Changed

- **BREAKING: every score now runs 0-100 where HIGHER IS BETTER.** It ran the
  other way in all three tools, while the app they hand off to has always scored
  higher-is-better; two directions in one product is a reader asking which way
  this particular number goes and getting it wrong quietly. A site that scored
  26 yesterday scores 74 today, and the bands mirror with it: the best is 81-100
  and the worst is 0-40. Anything holding an old number, including a stored
  reading, is reading it upside down until it is migrated.
- Each tool's ladder now takes its band edges from one shared list rather than
  repeating them, and the consolidated verdict is the LOWEST of the readings
  that ran rather than the highest.
- The hand-off now carries **every** reading's site key, joined by `_` in the
  one `sitekey` parameter, so all three land in LumioGuard rather than only the
  one that set the verdict. A repeated parameter was tried first: the app parses
  its search with zod, `sitekey` is a string there, and `?sitekey=A&sitekey=B`
  arrived as an array and threw before any route matched, rendering a blank
  page. The separator is outside the key alphabet, so a joined value can only
  split one way. The worst reading is still first, and decides where the visitor
  lands.
- Each reading's score is now stamped into its own section's heading instead of
  sitting in a strip above it. Two panels named the same tool and put the number
  a screen away from the findings it was the sum of. The tier's sentence went
  with the strip: the findings under it are the explanation, and a line
  restating the band in other words read as a caption rather than a verdict.
- CI now runs on every pull request and on pushes to master, rather than only
  when dispatched by hand. A contributor could previously open a pull request
  and receive no lint, no typecheck and no tests.
- Posting a reading is one implementation in `api-core` rather than one per
  tool. The two copies were the SIGNING code, so a correction to either could
  silently miss the other; what actually differs is four strings and the payload
  shape, and those are now arguments.
- Every dependency with a known advisory was updated, clearing 21 of them
  including one critical. All were build tooling; nothing that ships was
  affected. `hono` is deliberately held at 4.12: 4.13 changes `HonoRequest` in a
  way that breaks the route helper's inference, and there is no security reason
  to take it.

### Fixed

- The hand-off button no longer sweeps a band of light across itself on a loop,
  and spells the name the way every other surface does: typed properly in the
  document, set lowercase for the eye, so a copy or a bookmark still gets it
  right.
- The verdict seal could paint with no colour at all. `inkFor` cast the tier
  string it was handed, so a tier outside the ladder returned `undefined` into
  an inline style, on the one element the whole report is built around. It now
  looks the tier up and falls back.
- Leakpeek's critical floor was written twice: once in the scorer and once as
  the top band's lower bound. Retuning the ladder would have moved the band and
  left the floor behind, landing a critical finding a tier below the one the
  README promises. It is now derived from the band, with a test holding them
  together.

### Security

- Leakpeek's read-only guarantee is now enforced by test rather than asserted:
  every request the prober makes is captured and checked for method and body.
  A `POST` appearing there is the difference between assessing a hole and
  exploiting one, and nothing on screen would have looked wrong.

## [0.1.0] - 2026-08-18

First release of both tools together, and the first with a public history.

### Added

- **Leakpeek**: reads a page, the bundle it ships, and where that bundle points
  at one, the app's own backend. Reports secrets left in the bundle, reachable
  source maps, missing security headers, trackers running with no consent gate,
  files served from the web root, and a Supabase table readable without signing
  in. Scores 0–100 where higher is worse, across Sealed, Exposed, Cracked and
  Wide Open, and any critical finding pins the score to at least 60.
- **Slopmeter**: crawls a few pages and scores how closely a site's choices
  match the defaults generated sites ship with, across Hand-Crafted, Lightly
  Templated, Heavily Templated and Pure Slop. Every point shows the tell that
  produced it.
- An optional hand-off into [LumioGuard](https://lumioguard.dev), governed by a
  single environment variable and **off by default**: unset, the word does not
  appear on the page.
- Shared packages so a third tool is a folder rather than a rewrite: wire
  contracts, design tokens, the drawn surface, and the transport both halves
  need.

### Security

- Leakpeek's probe engine issues `GET` only, enforced by one request primitive
  with no code path that writes.
- Evidence is redacted where it is produced: row counts and column names, never
  values; keys masked.
- Slopmeter's rule pack does not cross the wire, and a test exists for it
  because nothing on screen looks wrong when it leaks.

[Unreleased]: https://github.com/lumiostack/lumioguard-tools/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/lumiostack/lumioguard-tools/releases/tag/v0.1.0
