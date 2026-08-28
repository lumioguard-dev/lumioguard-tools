## Why

<!-- Explain the problem and why this change belongs here. The diff shows what changed. -->

## Verification

```text
pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm rules:check
```

- [ ] The complete gate passes.
- [ ] Behaviour changes are reflected in the relevant README.

## Detection changes

<!-- Delete this section when it does not apply. -->

- [ ] New or changed rules include examples that should match and examples that
      must not match.
- [ ] Slopmeter parity still matches exactly, or the intentional score change is
      explained above. Fixtures were not retuned to hide a mismatch.

## Boundary changes

<!-- Delete this section when it does not apply. -->

- [ ] No rule id, category, fix, or catalogue data crosses the wire.
- [ ] Report evidence is redacted where it is created.
- [ ] Leakpeek target requests remain `GET` only.
- [ ] Server-side URLs, including redirects and discovered resources, pass
      through `TargetResolver`.

## Fork behaviour

- [ ] No LumioGuard address or integration appears unless it is configured.
- [ ] No scanned address, reading key, secret, or target data reaches analytics.
