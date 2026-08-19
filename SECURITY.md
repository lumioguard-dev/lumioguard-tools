# Security

## Reporting a vulnerability in these tools

**Do not open a public issue.** Use GitHub's private reporting on this
repository (Security, then Report a vulnerability), or email
**security@lumiostack.com**.

Please include what you did, what happened, and what you expected. A proof of
concept helps enormously; a URL that reproduces it helps more.

You will get an acknowledgement within three working days and an assessment
within ten. If a fix is warranted we will agree a disclosure date with you, and
you will be credited unless you would rather not be.

These tools read other people's websites, so the findings we care most about are
the ones that turn a reader into something else:

- Anything that makes Leakpeek **write** to a target rather than read it
- Anything that gets a target's data into a report, past the redaction
- Server-side request forgery: persuading either tool to fetch something it
  should not reach, such as a cloud metadata endpoint or a private address
- Forging an ingest signature, or replaying a captured reading
- Recovering Slopmeter's rule pack from what crosses the wire

## Scanning other people's sites

**Only scan a site you own, or one whose owner has asked you to.**

This is not a formality. Leakpeek proves a finding by actually reading the
target's backend: it asks a discovered table for rows and reports whether any
came back. That is a real request against someone else's infrastructure, and
whether it is welcome is not something a tool can decide for you. In several
countries it is not merely rude.

The engine is built to stay on the right side of that line: `GET` only, one
request primitive, no code path that writes, one URL per human action. The line
it cannot draw is the one around consent.

## What the tools do to a target

So you can judge the above for yourself:

| | |
|---|---|
| **Requests** | `GET` only. No `INSERT`/`UPDATE`/`DELETE`, no mutating RPC, no account creation, no writes to storage |
| **Volume** | A handful of requests per scan. Slopmeter crawls a bounded number of pages; Leakpeek reads the page, its bundle, and a small set of probes |
| **Identification** | Both send a User-Agent naming the tool, so a site owner can see what it was |
| **Credentials** | Only what the site already published to every visitor, such as a Supabase anon key found in the bundle |
| **Retention** | Nothing is stored unless you configure the optional LumioGuard integration, which is off by default |

## Evidence in reports

Reports are rendered on sites the reader does not own, so evidence is redacted
where it is produced rather than on the way out: row counts and column names,
never values; keys masked. A finding that could only be proven by writing is
reported as unverified rather than proven.

If you find a report that leaks a target's data, that is a vulnerability in
these tools. Please report it as above.

## Supported versions

The tools are pre-1.0 and fixes land on `master`. There are no maintained
release branches yet, so please report against the current `master`.
