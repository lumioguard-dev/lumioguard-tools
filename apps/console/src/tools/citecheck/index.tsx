import { apiBase } from '../apiBase.js';
import { toolCopy } from '../catalogue.js';
import type { ToolDescriptor } from '../registry.js';
import { ScanClient } from './ScanClient.js';
import { AgentSlip } from './report/AgentSlip.js';
import { SignalList } from './report/SignalList.js';
import { tierInk } from './theme.js';

const client = new ScanClient(apiBase('citecheck'));

export const citecheck: ToolDescriptor = {
  ...toolCopy('citecheck'),
  async run(address, signal) {
    const result = await client.crawl(address, signal);
    return {
      score: result.site.score,
      tier: result.site.tier,
      tierDescription: result.site.tierDescription,
      ink: tierInk(result.site.tier),
      siteKey: result.siteKey,
      render: (verdict) => (
        <>
          <SignalList
            signals={result.signals}
            pagesScanned={result.pagesScanned}
            verdict={verdict}
          />
          <AgentSlip agents={result.agents} robotsRead={result.sources.robotsTxt} />
        </>
      ),
      culprits: result.signals
        .filter((item) => item.weight > 0)
        .sort((a, b) => b.weight - a.weight)
        .map((item) => ({
          id: item.id,
          title: item.title,
          note: item.pages === 1 ? 'on one page' : `on ${item.pages} pages`,
          cost: item.weight,
        })),
      pages: {
        count: result.pagesScanned,
        maxDepth: result.maxDepthReached,
        rows: result.pages.map((page) => ({
          url: page.url,
          depth: page.depth,
          score: page.score,
          tier: page.tier,
        })),
      },
    };
  },
};
