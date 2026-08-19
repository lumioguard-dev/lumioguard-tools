# LumioGuard Tools

**Paste a URL. Find out something true about the site.**

You shipped something. Maybe you built it fast, maybe an AI builder wrote most of
it. Two questions are worth asking before anyone else does:

**Does it look like everyone else's?** and **is it leaking?**

These are the tools that answer them. Point them at any address. No sign-up, no
access to your code, no connection to your database, no agent to install. They
read what your site already serves to the public, exactly as a visitor would.

---

## Leakpeek: what is this app exposing?

Leakpeek reads your page and the JavaScript it ships. Where that JavaScript
points at a backend, it reads that too. Then it tells you what a stranger can
already reach.

[![The Leakpeek report on the demo app: a Wide Open verdict, with a critical
finding that a database table is readable without signing
in](assets/leakpeek.jpg)](tools/leakpeek)

The finding at the top of that report is the one that matters: a database table
returning rows to a request that never signed in. Not "you may have a
misconfiguration", but the actual read, the actual row count, the actual column
names. Something you can act on before breakfast.

It also finds API keys baked into your bundle, source maps you did not mean to
publish, `.env` files served from your web root, missing security headers, and
trackers running before anyone consented.

**It reads. It never writes.** No account is created, no row is changed, nothing
is deleted. And the report proves a hole without becoming one: it shows you that
1,240 rows came back and what the columns were called, never what was in them.

**[Read more →](tools/leakpeek)**

---

## Slopmeter: how much of this is still the template?

Slopmeter crawls a few pages and scores how closely your site's choices match the
defaults that generated sites ship with. Purple-blue gradients. Rounded cards in a
three-up grid. "Elevate your workflow." The things that make a hundred sites look
like one site.

[![The Slopmeter report on the demo app: a Lightly Templated verdict, with a
screenshot and the weighted tells that produced the score](assets/slopmeter.jpg)](tools/slopmeter)

Every point in the score comes with the reason it was scored, so you can disagree
with it. That is the point: a number you cannot see the reasons for is a number
you cannot argue with, and you should not trust one.

**It judges the page, never you and never your tools.** Which builder made the
site is reported and scores exactly zero. Something built with AI that somebody
actually designed comes out clean; a hand-coded page of stock defaults does not.

**[Read more →](tools/slopmeter)**

---

## Try them

Both are hosted and free to use:

| | |
|---|---|
| **Leakpeek** | [lumioguard-leakpeek-web.pages.dev](https://lumioguard-leakpeek-web.pages.dev) |
| **Slopmeter** | [lumioguard-slopmeter-web.pages.dev](https://lumioguard-slopmeter-web.pages.dev) |

If you want something to point them at,
[leakpeek-demo.vercel.app](https://leakpeek-demo.vercel.app/) is a deliberately
broken app kept for exactly that. It is the site in both screenshots above.

**Only scan a site you own, or one whose owner has asked you to.** Leakpeek
proves a finding by actually reading the target's backend, which is a real
request against someone else's infrastructure. See [SECURITY.md](SECURITY.md)
for what each tool does to a site, and how to report a flaw in them.

## Run them yourself

Everything here is MIT-licensed and runs on your own machine. Node 22+ and
pnpm 9+:

```bash
git clone https://github.com/lumiostack/lumioguard-tools.git
cd lumioguard-tools
pnpm install
pnpm dev
```

That starts both tools:

| | Try it at | Its API |
|---|---|---|
| Slopmeter | http://127.0.0.1:5210 | http://127.0.0.1:8810 |
| Leakpeek | http://127.0.0.1:5220 | http://127.0.0.1:8820 |

Nothing else is required. No API keys, no accounts, no services to sign up for.
A fresh clone scans, scores and renders a full report out of the box.

## What is in here

```
packages/     what every tool shares: contracts, design tokens, the surface
tools/
  slopmeter/  core (the engine) · api (a Worker) · web (the report)
  leakpeek/   the same three
```

Each tool is a detection engine, a Cloudflare Worker that feeds it, and a client
that draws the result. Adding a third tool means adding a third folder, which is
the whole reason this is a monorepo rather than two repos.

The engines are plain TypeScript with no I/O at all, which is why the whole test
suite runs offline in a few seconds, and why a rule is easy to contribute.

## Contributing

New detection rules, bug reports and whole new tools are all welcome. The
[contributing guide](CONTRIBUTING.md) covers the layout, the local ports, running
the checks and shipping a tool.

## Licence

MIT. See [LICENSE](LICENSE). Do what you like with it.
