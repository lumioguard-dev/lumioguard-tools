import { ReadingTier, consolidatedScore, readingBandFor } from '@lumioguard/shared';
import { NextSteps, Panel, PanelGrid, ReadingState, Verdict } from '@lumioguard/ui';
import { useState } from 'react';
import { VERDICT_SCALE } from '../../theme/reading.js';
import type { ToolDescriptor } from '../../tools/registry.js';
import { type Reading, useReadings } from '../scan/useReadings.js';
import { Culprits } from './Culprits.js';
import { FailedReadings } from './FailedReadings.js';
import { PageList } from './PageList.js';
import { PageLists } from './PageLists.js';
import { ReadingSection } from './ReadingSection.js';
import { SiteShot } from './SiteShot.js';

const HANDOFF_OFFER =
  'This is what a stranger with the URL can see. Log in for the full check, free.';

/**
 * Every reading of one site, under one verdict.
 *
 * The verdict panel is mounted once and stays mounted through the wait and out
 * the other side, so the needle hunts for as long as the readings take and then
 * closes on the answer, rather than one component animating and a different one
 * appearing already finished.
 *
 * Sections appear as their own tool lands. Holding them all back until the
 * slowest finished would make a crawl decide when a single page scan is allowed
 * on screen.
 */
export function ConsoleReport({
  address,
  tools,
  onNewSite,
}: {
  readonly address: string;
  readonly tools: readonly ToolDescriptor[];
  readonly onNewSite: () => void;
}): JSX.Element {
  const { readings, isReading } = useReadings(address, tools);
  const [showPages, setShowPages] = useState(false);

  const landed = readings.filter(
    (reading): reading is Reading & { outcome: NonNullable<Reading['outcome']> } =>
      reading.outcome !== null,
  );
  const score = consolidatedScore(landed.map((reading) => reading.outcome.score));
  // The LOWEST score: higher is better, so the worst reading is the smallest.
  const worst = landed.reduce<(typeof landed)[number] | null>(
    (found, reading) =>
      found === null || reading.outcome.score < found.outcome.score ? reading : found,
    null,
  );

  /**
   * The worst reading's key first. Each API mints its own and the hand-off
   * carries them all, but a reader on the far side that takes only the first
   * should get the reading that produced the verdict rather than whichever tool
   * happened to be listed first.
   */
  const siteKeys = [
    ...(worst === null ? [] : [worst.outcome.siteKey]),
    ...landed.filter((reading) => reading !== worst).map((reading) => reading.outcome.siteKey),
  ];

  const everyOneFailed = readings.length > 0 && !isReading && landed.length === 0;

  /**
   * Nothing read means NO VERDICT, not a clean one.
   *
   * The meter used to be drawn whatever happened, and with no reading behind it
   * the needle rested at zero and the seal stamped CLEAN in green over a site
   * that had refused every request. A score is a claim about evidence; with
   * none there is nothing to claim, and the panel says so instead.
   */
  if (everyOneFailed) {
    return (
      <PanelGrid centred>
        <Panel hand="c" red span={12}>
          <p className="pen-title">Nothing could be read</p>
          <p role="alert" className="mt-3 max-w-[62ch] text-body text-ink-2">
            Every reading of {address} failed, so there is no verdict to give.
          </p>
          <ul className="mt-4 flex list-none flex-col gap-1 p-0">
            {readings.map((reading) => (
              <li key={reading.tool.id} className="text-13 leading-[1.5] text-ink-3">
                <span className="font-semibold text-ink-2">{reading.tool.label}</span>:{' '}
                {reading.error}
              </li>
            ))}
          </ul>
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

  /**
   * The page list REPLACES the report rather than expanding inside it. It is a
   * reference you open, and unfolded in place it pushed everything below it off
   * the screen with no way back to where the reader was.
   */
  if (showPages) {
    return (
      <PanelGrid>
        <PageList readings={readings} onBack={() => setShowPages(false)} />
      </PanelGrid>
    );
  }

  return (
    <PanelGrid>
      <Verdict
        scale={VERDICT_SCALE}
        subject={address}
        score={score}
        tier={landed.length === 0 ? ReadingTier.Clean : readingBandFor(score).tier}
        waiting={isReading ? <ReadingState /> : undefined}
        onNewSite={onNewSite}
        actions={
          landed.length === 0 ? undefined : <NextSteps offer={HANDOFF_OFFER} siteKey={siteKeys} />
        }
      />

      {!isReading && landed.length > 0 && <FailedReadings readings={readings} />}

      {/* Both are ABOUT the whole reading, so neither is drawn until the whole
          reading is in. Ranking culprits across tools while a tool is still
          reading shows an order that is about to change, and the render beside
          it would arrive alone and then be shoved down. */}
      {!isReading && landed.length > 0 && (
        <>
          <SiteShot address={address} />
          <Culprits readings={readings} />
        </>
      )}

      {landed.map((reading) => (
        <ReadingSection key={reading.tool.id} reading={reading} />
      ))}

      <PageLists readings={readings} onOpen={() => setShowPages(true)} />
    </PanelGrid>
  );
}
