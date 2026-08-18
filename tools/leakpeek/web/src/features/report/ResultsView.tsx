import { ExposureTier } from '@lumioguard/shared';
import { NextSteps, Verdict } from '@lumioguard/ui';
import { Panel, PanelGrid, ReadingState } from '@lumioguard/ui';
import { VERDICT_SCALE } from '../../theme/tier.js';

import { useSiteScan } from '../scan/useSiteScan.js';
import { FindingList } from './FindingList.js';

/**
 * The reading has its own page, and the page exists from the first moment. The
 * verdict panel is mounted once and stays mounted through the wait and out the
 * other side, so the needle hunts for as long as the read takes and then closes
 * on the answer.
 */
const HANDOFF_OFFER =
  'This is what a stranger with the URL can see. Log in for the full check, free.';

export function ResultsView({
  address,
  onNewSite,
}: {
  readonly address: string;
  readonly onNewSite: () => void;
}): JSX.Element {
  const { result, error, isScanning } = useSiteScan(address);

  if (error !== null) {
    return (
      <PanelGrid centred>
        <Panel hand="c" red span={12}>
          <p className="pen-title">That did not read</p>
          <p role="alert" className="mt-3 max-w-[56ch] text-body text-ink-2">
            {error}
          </p>
          <button
            type="button"
            onClick={onNewSite}
            className="mt-6 self-start rounded-drawn-chip border-2 border-pen-700 bg-transparent px-[22px] py-[13px] font-sans text-15 font-medium text-ink-1 transition-colors hover:border-pen-600 hover:bg-paper-high"
          >
            Try another site
          </button>
        </Panel>
      </PanelGrid>
    );
  }

  const waiting = isScanning || result === null;

  return (
    <PanelGrid>
      <Verdict
        scale={VERDICT_SCALE}
        subject={address}
        score={result?.score ?? 0}
        tier={result?.tier ?? ExposureTier.Sealed}
        waiting={waiting ? <ReadingState /> : undefined}
        onNewSite={onNewSite}
        actions={
          result === null ? undefined : <NextSteps offer={HANDOFF_OFFER} siteKey={result.siteKey} />
        }
      />

      {result !== null && (
        <FindingList
          findings={result.findings}
          backendProbed={result.backendProbed}
          stack={result.stack}
        />
      )}
    </PanelGrid>
  );
}
