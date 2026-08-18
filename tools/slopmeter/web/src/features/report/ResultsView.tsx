import { Tier, mshotsUrl } from '@lumioguard/shared';
import { NextSteps, Verdict } from '@lumioguard/ui';
import { Panel, PanelGrid, PanelHead, ReadingState } from '@lumioguard/ui';
import { VERDICT_SCALE } from '../../theme/tier.js';

import { useSiteScan } from '../scan/useSiteScan.js';
import { PagesView } from './PagesView.js';
import { ResolvingShot } from './ResolvingShot.js';
import { SiteReport } from './SiteReport.js';
import { TopTells } from './TopTells.js';

/**
 * The reading has its own page, and the page exists from the first moment.
 *
 * The verdict panel is mounted once and stays mounted through the wait and out
 * the other side. That is not a detail: it is what lets the needle hunt for as
 * long as the read takes and then close on the answer, instead of one component
 * animating and a different one appearing already finished.
 *
 * Everything below the render waits until there is something in it. A skeleton
 * of empty panels is a page describing its own layout.
 */
const HANDOFF_OFFER = 'This is the surface scan. Log in for the full scan, free.';

export function ResultsView({
  address,
  showPages,
  onOpenPages,
  onClosePages,
  onNewSite,
}: {
  readonly address: string;
  readonly showPages: boolean;
  readonly onOpenPages: () => void;
  readonly onClosePages: () => void;
  readonly onNewSite: () => void;
}): JSX.Element {
  const { result, error, isScanning } = useSiteScan(address);
  const shotUrl = mshotsUrl(address);

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

  if (result !== null && showPages) {
    return <PagesView result={result} onBack={onClosePages} />;
  }

  const shot =
    shotUrl === null ? undefined : (
      <ResolvingShot
        src={shotUrl}
        alt={`Render of ${address}`}
        address={address}
        resolving={isScanning}
      />
    );

  const waiting = isScanning || result === null;

  return (
    <PanelGrid>
      <Verdict
        scale={VERDICT_SCALE}
        subject={address}
        score={result?.site.score ?? 0}
        tier={result?.site.tier ?? Tier.HandCrafted}
        waiting={waiting ? <ReadingState /> : undefined}
        onNewSite={onNewSite}
        actions={
          result === null ? undefined : <NextSteps offer={HANDOFF_OFFER} siteKey={result.siteKey} />
        }
      />

      {/* Both columns from the first moment. The render used to take the full
          width while the read ran and then halve when the culprits arrived
          beside it, which made the wait a different page from the answer and
          put the loudest movement on screen at the exact moment the verdict
          was landing. They hold their columns now; the right one is ruled
          while it waits. */}
      {shot !== undefined && (
        <Panel hand="d" span={7}>
          <PanelHead title="See it for yourself" />
          {shot}
        </Panel>
      )}

      <TopTells result={result} />
      {result !== null && <SiteReport result={result} onOpenPages={onOpenPages} />}
    </PanelGrid>
  );
}
