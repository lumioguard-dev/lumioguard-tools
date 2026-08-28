import { MarkTemplate } from '@lumioguard/ui';
import { LeaderboardPreview } from '../../features/leaderboard/LeaderboardPreview.js';
import { apiBase } from '../apiBase.js';
import { toolCopy } from '../catalogue.js';
import type { ToolDescriptor } from '../registry.js';
import { ScanClient } from './ScanClient.js';
import { SiteReport } from './report/SiteReport.js';
import { VERDICT_SCALE, tierInk } from './theme.js';

const client = new ScanClient(apiBase('slopmeter'));

export const slopmeter: ToolDescriptor = {
  ...toolCopy('slopmeter'),
  mark: MarkTemplate,
  scale: VERDICT_SCALE,
  belowAsk: (onScan) => <LeaderboardPreview onScan={onScan} />,
  async run(address, signal) {
    const result = await client.crawl(address, {}, signal);
    return {
      score: result.site.score,
      tier: result.site.tier,
      tierDescription: result.site.tierDescription,
      ink: tierInk(result.site.tier),
      siteKey: result.siteKey,
      render: (verdict) => <SiteReport result={result} verdict={verdict} />,
      culprits: result.signals
        .filter((item) => item.weight > 0)
        .sort((a, b) => b.weight - a.weight)
        .map((item) => ({
          id: item.id,
          title: item.label,
          note: `on ${item.pages} of ${result.pagesScanned} pages`,
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
