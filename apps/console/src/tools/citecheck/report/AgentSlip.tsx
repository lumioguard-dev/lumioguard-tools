import { drawnCycle } from '@lumioguard/design-tokens';
import type { AgentAccess, AgentPostureDto } from '@lumioguard/shared';
import { Panel } from '@lumioguard/ui';
import { accessInk } from '../theme.js';

/**
 * REPORTED, NEVER SCORED, and the panel says so in its own words: a site that turns
 * these crawlers away on purpose should find that decision confirmed, not corrected.
 */
const ACCESS_LABEL: Record<AgentAccess, string> = {
  allowed: 'may read',
  blocked: 'turned away',
  unmentioned: 'not mentioned',
};

function AgentTag({
  posture,
  index,
}: {
  readonly posture: AgentPostureDto;
  readonly index: number;
}): JSX.Element {
  const tint = accessInk(posture.access);
  return (
    <span
      className="inline-flex items-baseline gap-[9px] border-2 bg-paper-high px-[11px] py-[5px]"
      style={{
        // From the token, not retyped: hand-written radii did not move when the
        // drawn scale was retuned.
        borderRadius: drawnCycle[index % drawnCycle.length],
        borderColor: `color-mix(in srgb, ${tint} 45%, transparent)`,
      }}
    >
      <span className="font-sans text-14 font-medium leading-none text-ink-1">{posture.agent}</span>
      <span className="font-hand text-13 lowercase leading-none" style={{ color: tint }}>
        {ACCESS_LABEL[posture.access]}
      </span>
    </span>
  );
}

export function AgentSlip({
  agents,
  robotsRead,
}: {
  readonly agents: readonly AgentPostureDto[];
  readonly robotsRead: boolean;
}): JSX.Element | null {
  if (agents.length === 0) return null;

  const blocked = agents.filter((posture) => posture.access === 'blocked');

  return (
    <Panel hand="d" span={12} dashed>
      <p className="pen-title">AI Search Visibility</p>

      <p className="mt-3 max-w-[68ch] text-body text-ink-2">
        {robotsRead
          ? `What robots.txt says to each answer engine’s crawler${blocked.length > 0 ? `, ${blocked.length} of ${agents.length} turned away` : ''}.`
          : 'No robots.txt, so nothing here directs these crawlers either way.'}
      </p>

      <div className="mt-5 flex flex-wrap gap-x-3 gap-y-[10px]">
        {agents.map((posture, index) => (
          <AgentTag key={posture.agent} posture={posture} index={index} />
        ))}
      </div>
    </Panel>
  );
}
