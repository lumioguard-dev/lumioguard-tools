// RELATIVE, not `@lumioguard/shared`, and it has to stay that way. This module
// is reached from `vite.config.ts`, which Vite bundles with esbuild before any
// alias exists: a bare specifier is left external, Node then loads the
// package's own entry, and that entry is TypeScript source. The build dies with
// `Unknown file extension ".ts"`. A relative path is bundled instead.
import {
  CITATION_BANDS,
  CITATION_MAX,
  EXPOSURE_BANDS,
  EXPOSURE_MAX,
  SCORE_MAX,
  TIER_BANDS,
} from '../../../../packages/shared/src/index.js';
import { type PageLink, pageLink } from '../../src/pages.js';

/**
 * The explainer pages, as data.
 *
 * They exist because the app is one screen with a URL bar on it, which is
 * nothing for a search engine to rank. These are prerendered documents with no
 * meter on them: the verdict stays on the one surface, and every page here
 * links into it.
 *
 * Everything numeric is read from the ladders in `shared`, never typed. A
 * retuned band moves the published table the same day it moves the score.
 */

export interface Table {
  readonly caption: string;
  readonly head: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

export interface Section {
  readonly heading: string;
  readonly body?: readonly string[];
  readonly list?: readonly string[];
  readonly table?: Table;
}

export interface ContentPage {
  readonly meta: PageLink;
  /** The sentence under the heading, and the one an answer is lifted from. */
  readonly lead: string;
  readonly sections: readonly Section[];
}

interface Band {
  readonly tier: string;
  readonly from: number;
  readonly to: number;
  readonly description: string;
}

/** Best band first, and the unbounded top `to` clipped to the end of the scale. */
function ladder(caption: string, bands: readonly Band[], max: number): Table {
  return {
    caption,
    head: ['Band', 'Score', 'What it means'],
    rows: [...bands]
      .reverse()
      .map((band) => [band.tier, `${band.from}-${Math.min(band.to, max)}`, band.description]),
  };
}

const CITE: ContentPage = {
  meta: pageLink('/can-ai-cite-your-site'),
  lead: 'An answer engine can only quote what it can read. Most of the crawlers feeding them do not run JavaScript, so what gets stored for your URL is whatever your server sent in the first response.',
  sections: [
    {
      heading: 'What a crawler actually receives',
      body: [
        'Open your own page, view source, and read what comes back. That text, before any script runs, is the whole of what most crawlers keep. A single-page app often sends a document containing one empty element and a script tag, and a browser fills it in a moment later. A crawler that does not run scripts never sees that moment.',
        'This is the single most expensive thing a site can get wrong here, because it is not a matter of degree. A page that arrives empty is not quoted less often. It is not quoted.',
      ],
    },
    {
      heading: 'The four things that stop a page being quoted outright',
      body: [
        'These are definitional rather than measured. Each one makes citation impossible whatever else is true of the page, so no amount of good structured data underneath changes the answer.',
      ],
      list: [
        'The page says noindex, so it is asking not to be in an index at all.',
        'The served document carries no readable text without JavaScript.',
        'The server answers a crawler user agent with 403 while serving a browser normally.',
        'The canonical tag points at a different host, handing the page away.',
      ],
    },
    {
      heading: 'What is not a barrier, despite the advice',
      body: [
        'Citecheck was calibrated against pages answer engines demonstrably quote every day: Wikipedia, MDN, and the Python, React, nginx and Postgres references. The rule was that such a page must come out in the top band, because nothing is in fact standing in its way.',
        'That corpus overturned most of a first cut made from intuition. Five of those six ship no JSON-LD at all. Four carry no meta description. Three have no canonical, and two have no h1. None of those can be a barrier to citation when the most-quoted references on the web are missing them.',
        'So best practice is not the same as a barrier, and only the barriers are scored heavily. An absence is a choice and costs nothing. A broken attempt is a defect and keeps its weight: a canonical that will not parse, JSON-LD that will not read, an hreflang no engine recognises. Somebody meant those to work, and they do not.',
      ],
    },
    {
      heading: 'robots.txt, sitemaps and llms.txt',
      body: [
        'A crawler reads robots.txt before it reads a page. A mistyped field there is skipped in silence, so the rule its author wrote was never in force and nothing anywhere reports it. Naming your sitemap in robots.txt costs one line and is the difference between a crawler finding it and guessing.',
        'llms.txt is a newer convention: a plain-text guide written for agents rather than browsers. Publishing one while separately telling most AI crawlers not to fetch anything is a contradiction, and one of the two files is stale.',
      ],
    },
    {
      heading: 'Blocking AI crawlers is a decision, not a defect',
      body: [
        'Nothing here scores a site for turning an agent away. That is a choice a site is entitled to make, and charging for it would be charging somebody for meaning what they said. What is worth reporting is two files the same site serves giving opposite instructions.',
      ],
    },
  ],
};

const KEYS: ContentPage = {
  meta: pageLink('/api-keys-in-frontend-code'),
  lead: 'Everything your app ships to the browser is readable by anyone who opens it. Minification is not concealment: a bundle is a text file served to the public, and searching it takes seconds.',
  sections: [
    {
      heading: 'Not every key in a bundle is a problem',
      body: [
        'This is the distinction that matters most, and the one most checklists get wrong. Some keys are designed to be public. A Supabase anon key, a Stripe publishable key, a Firebase web config: these are meant to ship, and finding one in a bundle is not by itself a finding.',
        'What makes them safe is what stands behind them. An anon key is safe because row-level security decides what it can read. Turn that off and the same key is a public read of your database. The key was never the control. The policy was.',
      ],
    },
    {
      heading: 'The keys that are always a problem',
      body: [
        'A service key is the opposite kind of object. It is designed to bypass policy, which is exactly why it must never reach a browser. A service_role key in a client bundle is not a misconfiguration to schedule, it is a live credential published to everyone who loads the page.',
      ],
    },
    {
      heading: 'Things that are served without anybody deciding to serve them',
      body: [
        'Most exposure is not a decision. It is a default nobody turned off, or a file that ended up inside the directory the web server publishes.',
      ],
      list: [
        'Source maps in production, which republish your original source alongside the bundle.',
        'A .env file inside the web root, readable at its own URL.',
        'A .git directory served as static files, from which the repository can be reconstructed.',
        'A database table that answers an unauthenticated read.',
      ],
    },
    {
      heading: 'Assessing a hole is not the same as opening one',
      body: [
        'A reading of a site should never change it. Leakpeek is GET only, through one request primitive, with no code path that writes. Where a finding could only be proven by writing, it is reported as unverified rather than proven.',
        'Evidence is redacted where it is produced, too. A readable table is reported as a row count and column names, never values, and a key is masked. A report gets read on sites the reader does not own, and a report that quotes the secret back has become the leak.',
      ],
    },
  ],
};

const SLOP: ContentPage = {
  meta: pageLink('/what-ai-slop-looks-like'),
  lead: 'Generated sites converge. Not because generation is bad, but because every generator reaches for the same defaults, and the defaults are recognisable once you know them.',
  sections: [
    {
      heading: 'The tells are specific, not a vibe',
      body: [
        'Slopmeter scores how closely a site matches the defaults generated sites ship with. It reads the page rather than judging it, so every signal is something you can go and look at.',
      ],
      list: [
        'A hero line straight from the template, and copy written in clipped slogans.',
        'The vocabulary chatbots reach for, and the it-is-not-just-X-it-is-Y construction.',
        'Stiff connectors: moreover, furthermore. Filler phrases that say nothing.',
        'A bento grid, cards inside cards, and a trusted-by logo row with nothing behind it.',
        'Coloured glows instead of shadows, text filled with a gradient, graph-paper grids.',
        'Rounded icon tiles stacked above headings, and tiny all-caps labels above them.',
        'The default icon set untouched, stock component-library theme values, one of the handful of fonts everything uses.',
        'Body text set too tight or too small to read comfortably.',
      ],
    },
    {
      heading: 'Why it is worth knowing',
      body: [
        'A templated page is not ugly. It is unspecific. Every choice it did not make is a thing it does not say about you, and a visitor who has seen forty pages like it has no reason to remember the forty-first.',
        'The same convergence has a second cost. When a page is assembled from the same defaults as everything else, there is less on it that an answer engine could lift and attribute to you rather than to the category.',
      ],
    },
    {
      heading: 'The score describes the output, never the author',
      body: [
        'Band names here are deliberate. They describe what came out, not who made it or how hard they worked, and a low score is not an accusation about the person who shipped it. Plenty of deliberate sites lean on a default or two that the crowd also uses, and the ladder has a band that says exactly that.',
      ],
    },
  ],
};

const SCORES: ContentPage = {
  meta: pageLink('/how-the-scores-work'),
  lead: 'Every reading runs 0-100 and higher is always better. The bands below are the published ladders, read straight out of the same constants the scorers use.',
  sections: [
    {
      heading: 'One scale, three vocabularies',
      body: [
        'Three tools reading one site would otherwise produce three numbers a reader has to reconcile. They share the scale so the numbers can be compared, and keep their own band names because what a number means is not the same in each.',
        'A consolidated verdict is the worst of the readings that ran, not an average. An average hides the one thing that is actually wrong.',
      ],
    },
    {
      heading: 'Can an answer engine read the page?',
      table: ladder('The citation ladder', CITATION_BANDS, CITATION_MAX),
      body: [
        'Any blocker pins the score into the bottom band on its own. A page that says noindex, or serves no text without JavaScript, or answers a crawler with 403, cannot be quoted whatever else is true of it.',
      ],
    },
    {
      heading: 'What is the site exposing?',
      table: ladder('The exposure ladder', EXPOSURE_BANDS, EXPOSURE_MAX),
    },
    {
      heading: 'How much came out of a template?',
      table: ladder('The slop ladder', TIER_BANDS, SCORE_MAX),
    },
    {
      heading: 'Calibrated against pages that are demonstrably quoted',
      body: [
        'The citation weights are set by a corpus of pages answer engines quote every day: Wikipedia, MDN, and the Python, React, nginx and Postgres references, alongside twenty popular pages across news, retail, health, government and SaaS. The rule fixing the numbers is that such a page must come out in the top band, because nothing is in fact standing in its way.',
        'That rule is what makes the score usable. Before it, the nginx reference scored 68 about a plain served HTML page that is quoted constantly. A scoring system that fails the things everyone cites is measuring its own opinions.',
      ],
    },
    {
      heading: 'Why an absence costs nothing',
      body: [
        'A signal a page simply does not publish is listed and weighs zero. Pricing absences built a score out of choices the most-quoted pages on the web make and are quoted anyway.',
        'A broken attempt is different and keeps its weight. Somebody meant that canonical to work, and it does not.',
      ],
    },
  ],
};

/** Every explainer, in the order they are offered. */
export const CONTENT_PAGES: readonly ContentPage[] = [CITE, KEYS, SLOP, SCORES];
