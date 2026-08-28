# Security

## Report a vulnerability

Do not disclose a vulnerability in a public issue. Use GitHub's private
vulnerability reporting for this repository, or email `hello@lumioguard.dev`.

Include the steps you took, the result, and what you expected instead. A small
reproduction or target URL is useful when it can be shared safely.

We aim to acknowledge reports within three working days and provide an initial
assessment within ten. When a fix is needed, we will coordinate disclosure with
you and offer credit unless you prefer to remain anonymous.

High-priority reports include:

- a Leakpeek request that changes a target;
- private target data appearing in a response or report;
- a server-side request reaching loopback, a private network, cloud metadata, or
  another forbidden destination;
- a forged or replayed reading-ingest request;
- a detector's private rule pack crossing the API boundary.

## Permission to scan

Only scan a site you own or have permission to assess.

Leakpeek does more than inspect static markup. It follows public client
configuration to a backend and may ask a discovered table whether rows are
readable without signing in. The request is read-only, but it still reaches
someone else's infrastructure. The software cannot supply consent on your
behalf.

## Requests made to a target

| Property | Behaviour |
|---|---|
| Method | `GET` only. No account creation, mutating RPC, database write, or storage write |
| Volume | Bounded crawls and a small set of supporting or verification requests |
| Identity | The tool names itself in its User-Agent, apart from the Citecheck request described below |
| Credentials | Only credentials already published to ordinary visitors, such as a Supabase anon key |
| Retention | None unless the optional LumioGuard ingest is configured |

Workers rate-limit expensive routes per client. The checked-in configuration
allows six calls per minute for each tool. Keep the `SCAN_RATE_LIMITER` binding
on public deployments. Scan and crawl endpoints accept `POST`, which prevents an
image or ordinary link from starting a scan by accident.

## Citecheck's crawler request

Citecheck fetches the entry page a second time using a known crawler User-Agent.
That is the only target request that does not name LumioGuard Citecheck.

The comparison detects sites that serve a browser normally but block or empty a
response for answer-engine crawlers. Using Citecheck's own identity would make
that check meaningless because most bot filters do not recognise it. The request
uses the same URL and `GET` method as the first fetch, carries no credentials,
and is used only to compare the returned content.

Forks that do not want this behaviour can remove the agent fetch in
`tools/citecheck/api/src/services/PageFetcher.ts`. Citecheck will continue to
run with `agentFetch: false`.

## Evidence and redaction

Evidence is reduced before it leaves the service that found it. Database probes
may report that rows were returned, how many, and which columns exist. They do
not return row values. Keys are masked.

A weakness that can only be verified through a write is reported as unverified.
The scanner does not perform the write to strengthen the claim.

Treat any report that exposes target data as a vulnerability in this project and
report it privately.

## Supported versions

The project is pre-1.0. Security fixes land on `master`; no older release branch
is maintained. Test and report against the current `master` branch.
