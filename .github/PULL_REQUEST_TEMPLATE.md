<!--
Thanks for sending this. Nothing here is bureaucracy: each line is something
that has broken before.
-->

## What this changes, and why

<!-- The why matters more than the what; the diff already says the what. -->

## Checks

```
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

- [ ] All four pass. Lint is clean, not merely quieter.

## If you touched a detection engine

- [ ] Slopmeter's parity suite still matches exactly, or it does not and I have
      said so below and explained why the new scores are the right ones.
      Never retune the fixtures to make it pass.
- [ ] A new or changed rule comes with the pages it fires on **and** pages it
      should not fire on.

## If you touched the wire

- [ ] No rule id, category or catalogue entry crosses it. The rule pack is the
      product; `api/__tests__/wire-boundary.test.ts` exists because nothing
      looks wrong on screen when this leaks.
- [ ] Evidence in a report is still redacted at the source: row counts and
      column names, never values; keys masked.

## If you touched Leakpeek's probes

- [ ] Still `GET` only. No write, no mutating RPC, no account creation.
- [ ] A finding that could only be proven by writing is reported as unverified,
      never as proven.

## Anything else

- [ ] No new hard-coded LumioGuard address. The integration is optional and off
      unless configured, and a fork must not advertise what it does not have.
- [ ] Behaviour that moved is reflected in the tool's `README.md`, which is the
      authority on what it does.
