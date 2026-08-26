# What each tool looks for

Generated from the rule sources by `scripts/build-rule-catalog.mjs`. Do not edit
it by hand: run `pnpm rules` after changing a rule, and `pnpm rules:check` fails
when this file and the engines disagree.

Every tool's own `README.md` is still the authority on what it does and what it
refuses to do. This is the index: the identifiers, and one line each.

**These identifiers are internal.** They are readable here because the engines
are open source, and they still never cross the wire: no route returns a rule
id, a category or the catalogue, and `api/__tests__/wire-boundary.test.ts` fails
if one starts to. A reader is shown a tell in its own words and the evidence for
it, never the identifier that produced it.

| Tool | Checks | Engine |
|---|---|---|
| [Slopmeter](#slopmeter) | 113 | `tools/slopmeter/core` |
| [Leakpeek](#leakpeek) | 14 | `tools/leakpeek/core` |
| [Citecheck](#citecheck) | 50 | `tools/citecheck/core` |

<a id="slopmeter"></a>

## Slopmeter

113 checks. See [`tools/slopmeter/README.md`](../tools/slopmeter/README.md) for what they mean and how they score.

| Id | Category | Weight | What it looks for |
|---|---|---|---|
| `copy.ai-vocabulary` | Copy | 10 | The vocabulary chatbots reach for |
| `copy.buzzwords` | Copy | 12 | Marketing buzzwords |
| `copy.emdash` | Copy | 10 | Em-dashes on almost every line |
| `copy.emoji-headers` | Copy | 8 | Headings that start with an emoji |
| `copy.emoji-soup` | Copy | 5 | Emoji used as decoration |
| `copy.filler-phrases` | Copy | 8 | Filler phrases that say nothing |
| `copy.formal-connectors` | Copy | 5 | Stiff connectors: moreover, furthermore |
| `copy.negative-parallelism` | Copy | 6 | The it-is-not-just-X-it-is-Y construction |
| `copy.stock-hero` | Copy | 8 | A hero line straight from the template |
| `impeccable.theater-phrase` | Copy | 4 | The "it is just theatre" line |
| `craft.aphoristic-cadence` | Craft | 5 | Copy written in clipped slogans |
| `craft.bounce-easing` | Craft | 4 | Bouncing animation |
| `craft.dark-glow` | Craft | 5 | Coloured glows instead of shadows |
| `craft.gradient-text` | Craft | 8 | Text filled with a gradient |
| `craft.grid-background` | Craft | 4 | Graph-paper grid behind the content |
| `craft.icon-tile-stack` | Craft | 6 | Rounded icon tiles stacked above headings |
| `craft.italic-serif-display` | Craft | 5 | The italic serif headline of the moment |
| `craft.justified-text` | Craft | 3 | Justified text without hyphenation |
| `craft.kicker-eyebrow` | Craft | 5 | Tiny all-caps labels above headings |
| `craft.layout-transition` | Craft | 3 | Animating width and height, which stutters |
| `craft.marquee` | Craft | 4 | An auto-scrolling marquee |
| `craft.nested-cards` | Craft | 4 | Cards inside cards |
| `craft.overused-font` | Craft | 6 | One of the handful of fonts everything uses |
| `craft.pulsing-dot` | Craft | 4 | A pulsing dot that reports nothing |
| `craft.radial-halo` | Craft | 5 | Decorative glowing halos |
| `craft.side-tab` | Craft | 8 | A thick coloured stripe down one edge |
| `craft.tight-leading` | Craft | 4 | Body text set too tight to read comfortably |
| `craft.tiny-text` | Craft | 4 | Text too small to read comfortably |
| `impeccable.blinking-cursor` | Craft | 3 | A fake blinking cursor |
| `impeccable.border-accent-on-rounded` | Craft | 4 | A thick border fighting a big corner radius |
| `impeccable.codex-grid-background` | Craft | 4 | Graph-paper grid behind the content |
| `impeccable.cream-palette` | Craft | 3 | The warm cream background of the moment |
| `impeccable.extreme-negative-tracking` | Craft | 4 | Letters squeezed together |
| `impeccable.flat-type-hierarchy` | Craft | 4 | Every text size nearly the same |
| `impeccable.hero-eyebrow-chip` | Craft | 5 | A little pill above a giant headline |
| `impeccable.hover-scale-transform` | Craft | 4 | Things that grow when you point at them |
| `impeccable.monotonous-spacing` | Craft | 3 | Every gap the same size |
| `impeccable.numbered-section-labels` | Craft | 3 | Sections numbered 01, 02, 03 |
| `impeccable.oversized-h1` | Craft | 4 | A whole sentence set at poster size |
| `impeccable.radial-spotlight` | Craft | 5 | Spotlight glows used as decoration |
| `impeccable.repeating-stripes` | Craft | 4 | Striped backgrounds |
| `impeccable.shape-assembled-illustration` | Craft | 3 | Illustrations built from basic shapes |
| `impeccable.single-font` | Craft | 3 | One font doing every job |
| `impeccable.thin-border-wide-shadow` | Craft | 7 | A hairline border under a big soft shadow |
| `default.lucide` | Default | 8 | The default lucide icon set, untouched |
| `default.next-default` | Default | 6 | A stock Next.js scaffold |
| `default.radix` | Default | 10 | Radix UI components |
| `default.shadcn` | Default | 12 | Stock shadcn/ui theme values |
| `default.tailwind-cdn` | Default | 14 | Tailwind loaded from the play CDN |
| `default.vite-build` | Default | 8 | A default Vite build |
| `fingerprint.ai-builder-misc` | Fingerprint | 22 | AI site-builder artifact |
| `fingerprint.base44` | Fingerprint | 32 | Built with Base44 |
| `fingerprint.bolt` | Fingerprint | 35 | Built with Bolt |
| `fingerprint.framer` | Fingerprint | 28 | Made with Framer |
| `fingerprint.lovable` | Fingerprint | 35 | Built with Lovable |
| `fingerprint.made-with-badge` | Fingerprint | 18 | Builder attribution badge |
| `fingerprint.replit` | Fingerprint | 35 | Hosted on Replit |
| `fingerprint.v0` | Fingerprint | 35 | Built with v0 |
| `fingerprint.webflow` | Fingerprint | 26 | Made with Webflow |
| `fingerprint.wix` | Fingerprint | 24 | Made with Wix |
| `human.custom-favicon` | Human | -2 | A favicon of its own |
| `human.custom-fonts` | Human | -2 | Type chosen, not inherited |
| `human.deep-content` | Human | -3 | Someone actually wrote this |
| `human.github` | Human | -3 | Links to its own source |
| `human.real-pages` | Human | -4 | Real pages behind the front door |
| `human.rich-meta` | Human | -2 | Metadata that was thought about |
| `layout.ai-palette` | Layout | 8 | The indigo-to-violet gradient every AI tool ships |
| `layout.bento` | Layout | 9 | A bento grid |
| `layout.dark-neon` | Layout | 5 | Dark background with neon accents |
| `layout.gradient-blob` | Layout | 9 | A blurry coloured glow behind the page |
| `layout.three-card-grid` | Layout | 6 | Three feature cards side by side |
| `layout.trusted-by` | Layout | 7 | A trusted-by logo row |
| `leftover.ai-citation-tokens` | Leftover | 35 | Chatbot citation codes left in the text |
| `leftover.assistant-phrases` | Leftover | 30 | A chatbot reply left in the copy |
| `leftover.create-next-app` | Leftover | 24 | The scaffold own title, never changed |
| `leftover.lorem` | Leftover | 22 | Lorem ipsum |
| `leftover.placeholder-contact` | Leftover | 8 | Fake contact details |
| `leftover.placeholder-images` | Leftover | 8 | Placeholder images |
| `leftover.placeholder-links` | Leftover | 10 | Links that go nowhere |
| `leftover.template-placeholders` | Leftover | 16 | An unfilled template slot |
| `leftover.todo-in-production` | Leftover | 9 | A developer TODO left in the visible text |
| `leftover.unrendered-markdown` | Leftover | 12 | Raw markdown showing as text |
| `leftover.your-company` | Leftover | 16 | A placeholder company name |
| `impeccable.all-caps-body` | Quality | 3 | Long passages in capitals |
| `impeccable.gray-on-colored` | Quality | 3 | Grey text on a coloured background |
| `impeccable.low-contrast` | Quality | 4 | Text too faint against its background |
| `impeccable.repeated-text-in-container` | Quality | 3 | The same words repeated inside one card |
| `impeccable.undersized-functional-text` | Quality | 4 | Text too small to read |
| `impeccable.wide-tracking-body` | Quality | 3 | Body text spaced too wide to read |
| `quality.console-log-inline` | Quality | 4 | Debug logging left switched on |
| `quality.default-favicon` | Quality | 5 | No favicon of its own |
| `quality.duplicate-headings` | Quality | 4 | The same heading repeated over and over |
| `quality.generic-title` | Quality | 5 | A placeholder page title |
| `quality.huge-dom` | Quality | 6 | An unusually complex page |
| `quality.inline-style-soup` | Quality | 4 | Styles written inline all over the markup |
| `quality.missing-lang` | Quality | 4 | Page language never declared |
| `quality.missing-meta` | Quality | 6 | No description for search or sharing |
| `quality.no-alt-text` | Quality | 6 | Images with no alt text |
| `quality.skipped-heading` | Quality | 4 | Heading levels skip a step |
| `stack.modern-backends` | Stack | 8 | AI-build-adjacent backend |
| `stack.netlify` | Stack | 5 | Hosted on Netlify |
| `stack.shadcn-combo` | Stack | 10 | Stock shadcn component stack |
| `stack.supabase` | Stack | 7 | Supabase backend |
| `stack.vercel` | Stack | 6 | Hosted on Vercel |
| `stack.vibe-combo` | Stack | 10 | Classic vibe-coding stack |
| `structure.div-soup` | Structure | 5 | Generic boxes instead of real structure |
| `structure.nav-goes-nowhere` | Structure | 7 | Navigation links that go nowhere |
| `structure.no-canonical` | Structure | 3 | No canonical address |
| `structure.no-h1` | Structure | 5 | No main heading |
| `structure.no-viewport` | Structure | 6 | Not set up for phones |
| `structure.oversized-payload` | Structure | 8 | A very heavy page |
| `structure.thin-shell` | Structure | 6 | Almost no text in the page itself |
| `structure.tracker-pileup` | Structure | 6 | A pile-up of third-party trackers |

<a id="leakpeek"></a>

## Leakpeek

14 checks. See [`tools/leakpeek/README.md`](../tools/leakpeek/README.md) for what they mean and how they score.

| Id | What it looks for |
|---|---|
| `file:env` | The .env file is served in production |
| `file:git` | The .git directory is served in production |
| `header:csp` | No Content-Security-Policy |
| `header:frame` | No clickjacking protection |
| `header:hsts` | No Strict-Transport-Security |
| `privacy:no-consent` | Trackers run with no cookie-consent gate |
| `privacy:no-policy` | No privacy policy linked |
| `secret:aws` | AWS access key id |
| `secret:github-pat` | GitHub token |
| `secret:google` | Google API key |
| `secret:openai` | OpenAI API key |
| `secret:stripe-live` | Stripe live secret key |
| `secret:supabase-service-role` | Supabase service_role key is in the client bundle |
| `source-map` | Source maps are served in production |

<a id="citecheck"></a>

## Citecheck

50 checks. See [`tools/citecheck/README.md`](../tools/citecheck/README.md) for what they mean and how they score.

| Id | Area | What it looks for |
|---|---|---|
| `access.agent-emptied` | access | Crawlers are served an all but empty page |
| `access.agent-refused` | access | The site refuses crawlers it serves to browsers |
| `access.agent-thin` | access | Crawlers are served less of the page than browsers |
| `access.disallowed` | access | robots.txt tells every crawler to leave this page alone |
| `access.invalid-robots` | access | robots.txt has … … a crawler cannot read |
| `access.llms-contradiction` | access | llms.txt invites AI readers that robots.txt turns away |
| `access.no-robots` | access | No robots.txt is served |
| `access.no-sitemap` | access | No sitemap was found |
| `access.noarchive` | access | No cached copy may be kept |
| `access.noindex` | access | This page tells every engine not to index it |
| `access.nosnippet` | access | This page forbids anyone quoting it |
| `access.shell` | access | The page is empty until JavaScript runs |
| `access.sitemap-conflict` | access | The sitemap offers a page robots.txt refuses |
| `access.sitemap-omits-page` | access | This page is not in the sitemap |
| `access.sitemap-unlisted` | access | The sitemap is served but robots.txt does not name it |
| `answer.undated` | answerability | The page carries no date anywhere |
| `document.bad-canonical` | document | The canonical URL will not parse |
| `document.canonical-elsewhere` | document | The canonical points at another hostname on this site |
| `document.canonical-mismatch` | document | The canonical points at the home page |
| `document.empty-heading` | document | A heading has no text in it |
| `document.foreign-canonical` | document | The page points its canonical at another site |
| `document.h1-as-style` | document | The page uses h1 … times |
| `document.invalid-hreflang` | document | … hreflang … not a language code |
| `document.long-title` | document | The title runs to … characters |
| `document.many-h1` | document | The page declares … top-level subjects |
| `document.meta-refresh` | document | The page redirects with a meta refresh |
| `document.missing-alt` | document | … of … images have no alt attribute |
| `document.mixed-content` | document | … … over http on an https page |
| `document.multiple-canonical` | document | The page declares … canonical URLs |
| `document.no-canonical` | document | No canonical URL |
| `document.no-description` | document | No meta description |
| `document.no-h1` | document | The page has headings but no h1 |
| `document.no-headings` | document | The page has no headings at all |
| `document.no-https` | document | The page is served over http |
| `document.no-lang` | document | The page does not declare its language |
| `document.no-links` | document | The page has no links at all |
| `document.no-title` | document | The page has no title |
| `document.no-viewport` | document | No viewport meta tag |
| `document.orphan` | document | The page links nowhere else on this site |
| `document.redirect-chain` | document | It took … redirects to reach this page |
| `document.relative-hreflang` | document | … hreflang … not a full address |
| `document.stock-title` | document | The title is the one the scaffold shipped with |
| `document.thin-description` | document | The description is a fragment |
| `document.uncrawlable-anchors` | document | … … not crawlable |
| `document.vague-anchors` | document | … … nothing about where it goes |
| `structured.absent` | structured | The page makes no machine-readable claims about itself |
| `structured.invalid` | structured | The structured data does not parse |
| `structured.no-entity` | structured | Nothing here says who publishes this |
| `structured.no-opengraph` | structured | No OpenGraph tags |
| `structured.untyped` | structured | The structured data declares no type |
