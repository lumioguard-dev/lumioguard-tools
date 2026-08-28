import { MarkExposed } from '@lumioguard/ui';
import { apiBase } from '../apiBase.js';
import { toolCopy } from '../catalogue.js';
import type { ToolDescriptor } from '../registry.js';
import { CommonIssues } from './CommonIssues.js';
import { ScanClient } from './ScanClient.js';
import { FindingList } from './report/FindingList.js';
import { VERDICT_SCALE, tierInk } from './theme.js';

const client = new ScanClient(apiBase('leakpeek'));

export const leakpeek: ToolDescriptor = {
  ...toolCopy('leakpeek'),
  mark: MarkExposed,
  scale: VERDICT_SCALE,
  belowAsk: () => <CommonIssues />,
  async run(address, signal) {
    const result = await client.scan(address, signal);
    return {
      score: result.score,
      tier: result.tier,
      tierDescription: result.tierDescription,
      ink: tierInk(result.tier),
      siteKey: result.siteKey,
      render: (verdict) => (
        <FindingList
          findings={result.findings}
          backendProbed={result.backendProbed}
          stack={result.stack}
          verdict={verdict}
        />
      ),
      culprits: result.findings
        .filter((item) => item.weight > 0)
        .sort((a, b) => b.weight - a.weight)
        .map((item) => ({ id: item.id, title: item.title, note: null, cost: item.weight })),
    };
  },
};
