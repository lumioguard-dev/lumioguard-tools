# Repository rules

These rules apply to humans and coding agents. Setup belongs in
`CONTRIBUTING.md`; product behaviour belongs in the READMEs.

## Boundaries that must hold

1. **The console never imports a detector.** A `core` import publishes the rule
   pack in the browser. Shared vocabulary belongs in `packages/shared`; report
   data crosses the wire through a mapper.
2. **Detection cores perform no I/O.** They do not fetch, read files, inspect the
   environment, take screenshots, or read the clock. Workers own those jobs.
3. **Rule internals stay server-side.** Rule ids, categories, fixes, and the
   catalogue do not appear in API responses or public routes.
4. **Leakpeek reads and never writes.** Target requests are `GET`. Do not create
   accounts, mutate RPCs, insert rows, update storage, or prove a finding through
   a write.
5. **Reports do not expose what they discover.** Redact evidence where it is
   created: counts and column names may pass; row values may not. Mask keys.
6. **The console serves meaningful HTML.** Generated documents fill `#root`
   from the same copy React uses. Do not ship an empty shell or alternate crawler
   copy.

## Architecture

There is one console and three independent tools. Each tool has a pure engine, a
Worker, and a visual surface under `apps/console/src/tools/<tool>`.

The selected readings share one report. The consolidated score is the lowest
tool score, never an average. Adding a clean reading must not improve a site
that still has an unresolved critical result.

Dependencies flow toward shared packages. Tools do not import one another. If
two tools need a type, move the vocabulary to `shared`.

Group code by responsibility. Worker transport belongs in `http`, orchestration
in `services`, domain-to-wire conversion in `mappers`, and construction in the
package's composition root. Keep feature components with their hooks and local
types.

## TypeScript

- Keep strict mode and `noUncheckedIndexedAccess` effective.
- Do not silence a mismatch with `as unknown as X` or a convenience cast. Narrow
  the value, validate it, or correct the type.
- Validate external data at the boundary. Code below it receives parsed values.
- Prefer `Record<Union, T>` when every member must be handled.
- Use an `as const` object plus a derived type instead of `enum`.
- Public fields and props are readonly. Exported functions state return types.
- Use classes for state or injected collaborators and functions for pure work.
  Do not introduce module-level mutable singletons.

## One source for one fact

Search before adding a constant. If two literals must agree, derive one from the
other or place both consumers behind one export. This matters for score bands,
ports, routes, labels, environment names, analytics events, and document copy.

Numbers in prose drift too. Interpolate a constant where copy ships with code,
or describe the behaviour without an unnecessary number.

## Detection rules

A finding must be observable and explainable from its input. Avoid claims about
intent, authorship, quality, or future ranking that the engine cannot prove.

Every detector needs positive and negative fixtures. Preserve known false
positives as regression cases.

Slopmeter credits may soften penalties but never erase them. Visible builder
residue may score; hosting provenance remains unscored.

Leakpeek distinguishes visibility from exploitability. Public client keys are
not findings by themselves. Active probes remain read-only, and an issue that
would require a write stays unverified.

Citecheck measures whether machines can reach and interpret served content. It
does not promise rankings or citations. A crawler policy is a choice; charge a
contradiction or broken signal, not a deliberate block.

After editing rules, run `pnpm rules`. `.documentation/RULES.md` is generated
and must not be edited by hand.

## Security

Every server-side target URL goes through `TargetResolver`. Revalidate redirects
and URLs discovered after the first request. Reject private networks, loopback,
cloud metadata services, credentials in URLs, and non-web schemes.

Internal errors receive generic responses. Do not return paths, stack traces,
rule source, or environment details.

Optional ingest fails closed. Recording requires its destination and secret.
Signatures cover the body and a timestamp, and stale signatures are rejected.

Keep rate limiting enabled on public Workers. CORS controls browser access to a
response; it does not authenticate callers or prevent abuse.

Never add secrets to the repository. Check untracked environment files before
sharing diffs or logs.

## Interface

Design tokens own colour, typography, spacing, radii, and elevation. Components
do not contain hex colours. Tokens are CSS `var()` expressions, so do not append
hex alpha or perform string arithmetic on them. Use `color-mix()`.

Light is the default theme. Dark mode follows an explicit stored choice, not the
operating system setting.

The uneven, hand-drawn frames are deliberate. Do not regularise them into a
uniform component-library look. Archivo is reserved for the main heading.

Motion is optional; the result is not. Honour reduced motion, and never depend
on `animation.finished` alone because background tabs may pause it. Every path
must settle into the correct final state.

Measure rendered output. Check narrow widths, long text, overflow, contrast,
collisions, and text below 12px. Sample intermediate animation frames too.

## Writing

- Use plain, specific language. State what the code does and where its boundary
  sits.
- Do not use em dashes.
- Avoid slogans, throat-clearing, fake quotations, inflated claims, and generic
  summaries.
- Do not turn a README into a development diary. Keep the reason; move release
  history to `CHANGELOG.md`.
- Comments default to none. Add one for a non-obvious reason, constraint, or
  failure mode, and keep it to three lines.
- Do not restate code in comments. Improve the name or shape instead.
- Preserve exact casing and vocabulary from domain types.

Copy assembled by code needs tests. Punctuation in one headline fragment can
break the sentence produced by the whole set.

## Open-source behaviour

The LumioGuard integration is optional and disabled by default. Without its
configuration, a fork must not show LumioGuard branding, offer a hand-off, or
contact a LumioGuard address. Never hard-code that address.

Reading keys share one `sitekey` parameter joined with `_`. The key alphabet
excludes that separator. The worst reading goes first. Do not use repeated
parameters; the receiving parser expects one string.

Nothing may depend on a path outside the repository. The optional parity corpus
is allowed only because its suite detects absence and skips cleanly.

## Verification

Before calling a code change complete, run:

```text
pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm rules:check
```

## Git and releases

Do not stage, commit, push, open a pull request, tag, release, or deploy unless
the user explicitly requests it. Completing work is not permission to publish.

Commit subjects use `type(scope): summary`, one line, imperative, lower case,
with no trailing full stop. Keep one logical change on a branch and squash false
starts before merge.

All workspaces share one semantic version. Normal releases bump the minor
version; patches are reserved for isolated fixes to an existing release. Use
`scripts/set-monorepo-version.mjs` instead of editing versions by hand.
