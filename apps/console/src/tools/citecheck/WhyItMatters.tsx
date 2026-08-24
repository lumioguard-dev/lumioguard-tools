import { MarkLegible, Panel, PanelHead } from '@lumioguard/ui';

/**
 * Why the reading is worth taking, on the page that offers it. Two short
 * paragraphs: what visibility buys, then what its absence costs.
 */
export function WhyItMatters(): JSX.Element {
  return (
    <Panel hand="c" span={12} className="mt-6">
      <PanelHead title="Be Found Wherever People Search" mark={<MarkLegible />} />
      <p className="mt-4 text-body leading-[1.6] text-ink-2">
        SEO and AI visibility help people discover your website when they are looking for a product,
        service, or answer. Clear, accessible content makes it easier for platforms like Google,
        ChatGPT, Perplexity, and Gemini to understand what your site offers and surface it to the
        right people.
      </p>
      <p className="mt-3 text-body leading-[1.6] text-ink-2">
        If your site is difficult to crawl, poorly structured, or unclear about what it does, you
        can miss those opportunities completely. Good visibility makes your website easier to find,
        understand, and recommend wherever people are searching.
      </p>
    </Panel>
  );
}
