import { apiBase } from '../apiBase.js';
import type { ToolDescriptor } from '../registry.js';
import { ScanClient } from './ScanClient.js';
import { FindingList } from './report/FindingList.js';
import { tierInk } from './theme.js';

const client = new ScanClient(apiBase('leakpeek'));

export const leakpeek: ToolDescriptor = {
  id: 'leakpeek',
  label: 'Security',
  summary: 'Reports what the site is exposing to anyone with the URL.',
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
