# What each tool checks

Every check the three tools run, in plain words.

Generated from the rule sources by `scripts/build-rule-catalog.mjs`. Do not edit
it by hand: run `pnpm rules` after changing a rule, and `pnpm rules:check` fails
when this file and the engines disagree.

## AI slop

112 things it looks for, at [`/tools/ai-slop-check`](https://lumioguard.dev/tools/ai-slop-check). What they mean and how they score is in [`tools/slopmeter/README.md`](../tools/slopmeter/README.md).

### Costs points (76)

Each of these subtracts its weight from 100.

- A bento grid
- A blurry coloured glow behind the page
- The indigo-to-violet gradient every AI tool ships
- A trusted-by logo row
- Three feature cards side by side
- Dark background with neon accents
- A developer TODO left in the visible text
- Fake contact details
- A hero line straight from the template
- Emoji used as decoration
- Navigation links that go nowhere
- Almost no text in the page itself
- A pile-up of third-party trackers
- Generic boxes instead of real structure
- No main heading
- No canonical address
- A thick coloured stripe down one edge
- Text filled with a gradient
- One of the handful of fonts everything uses
- Rounded icon tiles stacked above headings
- Tiny all-caps labels above headings
- Bouncing animation
- An auto-scrolling marquee
- A pulsing dot that reports nothing
- Coloured glows instead of shadows
- Decorative glowing halos
- Graph-paper grid behind the content
- Body text set too tight to read comfortably
- Text too small to read comfortably
- Justified text without hyphenation
- The italic serif headline of the moment
- Copy written in clipped slogans
- Cards inside cards
- A hairline border under a big soft shadow
- A little pill above a giant headline
- Spotlight glows used as decoration
- Striped backgrounds
- A thick border fighting a big corner radius
- A whole sentence set at poster size
- Letters squeezed together
- Sections numbered 01, 02, 03
- A fake blinking cursor
- The warm cream background of the moment
- Every gap the same size
- Illustrations built from basic shapes
- One font doing every job
- The "it is just theatre" line
- Built with v0
- Built with Lovable
- Built with Bolt
- Built with Base44
- Hosted on Replit
- Made with Framer
- Made with Webflow
- Made with Wix
- AI site-builder artifact
- Builder attribution badge
- No favicon of its own
- A placeholder page title
- Stock shadcn/ui theme values
- The default lucide icon set, untouched
- Chatbot citation codes left in the text
- A chatbot reply left in the copy
- The scaffold own title, never changed
- Lorem ipsum
- A placeholder company name
- An unfilled template slot
- Raw markdown showing as text
- Placeholder images
- Marketing buzzwords
- Em-dashes on almost every line
- The vocabulary chatbots reach for
- Headings that start with an emoji
- Filler phrases that say nothing
- The it-is-not-just-X-it-is-Y construction
- Stiff connectors: moreover, furthermore

### Earns points back (6)

Evidence of deliberate work. Together these can return at most half of what the penalties took.

- Real pages behind the front door
- Links to its own source
- Someone actually wrote this
- Metadata that was thought about
- Type chosen, not inherited
- A favicon of its own

### Reported, never scored (30)

Shown with the rest of the evidence and worth zero: real defects the report should still name, tells measured to fire more on hand-built pages than generated ones, and where the site was deployed.

- A very heavy page
- Not set up for phones
- Animating width and height, which stutters
- Things that grow when you point at them
- Every text size nearly the same
- Text too small to read
- Long passages in capitals
- Body text spaced too wide to read
- The same words repeated inside one card
- Text too faint against its background
- Grey text on a coloured background
- Hosted on Vercel
- Hosted on Netlify
- Supabase backend
- AI-build-adjacent backend
- Classic vibe-coding stack
- Stock shadcn component stack
- No description for search or sharing
- Images with no alt text
- Page language never declared
- Heading levels skip a step
- Debug logging left switched on
- An unusually complex page
- Styles written inline all over the markup
- The same heading repeated over and over
- Tailwind loaded from the play CDN
- Radix UI components
- A default Vite build
- A stock Next.js scaffold
- Links that go nowhere

## Security

14 things it looks for, at [`/tools/security-check`](https://lumioguard.dev/tools/security-check). What they mean and how they score is in [`tools/leakpeek/README.md`](../tools/leakpeek/README.md).

- No Content-Security-Policy
- No Strict-Transport-Security
- No clickjacking protection
- Trackers run with no cookie-consent gate
- No privacy policy linked
- OpenAI API key
- Stripe live secret key
- AWS access key id
- Google API key
- GitHub token
- Supabase service_role key is in the client bundle
- Source maps are served in production
- The .env file is served in production
- The .git directory is served in production

## SEO & AI visibility

50 things it looks for, at [`/tools/seo-ai-visibility-check`](https://lumioguard.dev/tools/seo-ai-visibility-check). What they mean and how they score is in [`tools/citecheck/README.md`](../tools/citecheck/README.md).

- The site refuses crawlers it serves to browsers
- Crawlers are served an all but empty page
- Crawlers are served less of the page than browsers
- This page tells every engine not to index it
- This page forbids anyone quoting it
- No cached copy may be kept
- The page is empty until JavaScript runs
- Anything that is not a recognised directive is skipped in silence
- No robots.txt is served
- No sitemap was found
- The sitemap is served but robots.txt does not name it
- llms.txt invites AI readers that robots.txt turns away
- This page is not in the sitemap
- robots.txt tells every crawler to leave this page alone
- The sitemap offers a page robots.txt refuses
- The page carries no date anywhere
- Every hop is a URL that has to be crawled before the real one is
- The page is served over http
- Browsers block or downgrade insecure assets on a secure page
- No viewport meta tag
- The page redirects with a meta refresh
- The page has no title
- The title is the one the scaffold shipped with
- A search result gives a title about 600 pixels
- No meta description
- The description is a fragment
- No canonical URL
- The page does not declare its language
- The canonical URL will not parse
- The canonical points at the home page
- The canonical points at another hostname on this site
- The page points its canonical at another site
- A page with more than one canonical has none
- A value an engine cannot parse is ignored outright
- An hreflang has to name an absolute URL
- The page has headings but no h1
- The page has no headings at all
- An h1 marks what a page is about
- More than one h1 means the page claims several subjects of equal standing
- A heading has no text in it
- The page links nowhere else on this site
- The page has no links at all
- Anchor text is how a page describes what it points at
- An image with no alt is content a reader that cannot see it never receives
- These navigate by script rather than by address
- The page makes no machine-readable claims about itself
- The structured data does not parse
- The structured data declares no type
- Nothing here says who publishes this
- No OpenGraph tags
