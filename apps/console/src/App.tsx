import { drawnCycle } from '@lumioguard/design-tokens';
import {
  DrawnRule,
  HowItWorks,
  Panel,
  PanelGrid,
  ParentCredit,
  ParentWordmark,
  ScanBar,
  ThemeToggle,
  useTheme,
} from '@lumioguard/ui';
import { AnalyticsEvent, useAnalytics } from '@lumioguard/web-core';
import type { ReactNode } from 'react';
import { EXAMPLES, HEADLINE, PUBLISHER, beats } from './copy.js';
import { LeaderboardPreview } from './features/leaderboard/LeaderboardPreview.js';
import { LeaderboardView } from './features/leaderboard/LeaderboardView.js';
import { ConsoleReport } from './features/report/ConsoleReport.js';
import { useConsoleRoute } from './features/scan/useConsoleRoute.js';
import { ToolPicker } from './features/select/ToolPicker.js';
import { LEADERBOARD_TOOL, type ToolCopy } from './tools/catalogue.js';
import { WhyItMatters } from './tools/citecheck/WhyItMatters.js';
import { TOOLS } from './tools/index.js';
import { CommonIssues } from './tools/leakpeek/CommonIssues.js';
import { type ToolDescriptor, toolsById } from './tools/registry.js';

function Masthead(): JSX.Element {
  const { theme, toggle } = useTheme();

  return (
    <>
      <div className="mx-auto flex w-full max-w-[76rem] items-center gap-[13px] px-4 pt-5 lg:px-[26px]">
        <ParentWordmark />
        <ThemeToggle theme={theme} onToggle={toggle} className="ml-auto" />
      </div>
      <div className="mx-auto mt-[6px] w-full max-w-[76rem] px-4 lg:px-[26px]">
        <DrawnRule />
      </div>
    </>
  );
}

/** Vite's asset base, without its trailing slash. `''` when served at a root. */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** What sits under the address field, which is the pinned reading's business. */
function belowAsk(pinned: string | undefined, onScan: (address: string) => void): ReactNode {
  if (pinned === LEADERBOARD_TOOL) return <LeaderboardPreview onScan={onScan} />;
  if (pinned === 'leakpeek') return <CommonIssues />;
  if (pinned === 'citecheck') return <WhyItMatters />;
  return undefined;
}

/** The h1 is the one place set in Archivo: the hand was hard to read at 48px. */
const H1 =
  'm-0 max-w-[20ch] text-balance font-headline text-36 leading-[1.12] text-hand lg:text-48';

/** Kept whole, so the site never falls to a line of its own mid-phrase. */
function SiteQuestion(): JSX.Element {
  return (
    <>
      {HEADLINE.lead} <span className="whitespace-nowrap">{HEADLINE.tail}</span>
    </>
  );
}

/**
 * One reading, offered. The arrow is the affordance: a bordered box on a page
 * full of bordered boxes does not read as somewhere to go.
 */
function ReadingLink({
  tool,
  radius,
}: {
  readonly tool: ToolDescriptor;
  readonly radius: string | undefined;
}): JSX.Element {
  const Mark = tool.mark;

  return (
    <a
      href={`${BASE}/${tool.slug}`}
      className="group flex items-center gap-[15px] border-2 border-pen-700/50 bg-transparent px-[17px] py-[15px] transition-colors hover:border-pen-300 hover:bg-paper-high"
      style={{ borderRadius: radius }}
    >
      <Mark />
      <span className="flex min-w-0 flex-col gap-[3px]">
        <span className="font-sans text-17 font-semibold leading-none text-ink-1">
          {tool.label}
        </span>
        <span className="text-14 leading-[1.5] text-ink-3">{tool.summary}</span>
      </span>
      <span
        aria-hidden="true"
        className="ml-auto shrink-0 text-20 text-pen-600 transition-transform group-hover:translate-x-[3px]"
      >
        &#8594;
      </span>
    </a>
  );
}

/**
 * The page that scans nothing: it asks which reading, then sends you to the one
 * that runs it. No address field, because a reader who has not chosen yet has
 * nothing to type one for.
 */
function ChooseView(): JSX.Element {
  return (
    <PanelGrid fills>
      <Panel hand="a" span={12}>
        <h1 className={H1}>
          <SiteQuestion />
        </h1>
        <ul className="m-0 mt-8 grid list-none gap-[11px] p-0">
          {TOOLS.map((tool, index) => (
            <li key={tool.id}>
              <ReadingLink tool={tool} radius={drawnCycle[index % drawnCycle.length]} />
            </li>
          ))}
        </ul>
      </Panel>
    </PanelGrid>
  );
}

/**
 * The task on the left in the order it is worked; what a reading is, drawn
 * beside it and braced off as a note about the work rather than part of it.
 */
function AskView({
  onScan,
  toolIds,
  onSelect,
  pinned,
  below,
}: {
  readonly onScan: (address: string) => void;
  readonly toolIds: readonly string[];
  readonly onSelect: (ids: readonly string[]) => void;
  readonly pinned: ToolCopy | null;
  /** Drawn under the ask, in the SAME grid: a second grid centres itself apart. */
  readonly below?: ReactNode;
}): JSX.Element {
  return (
    <PanelGrid fills>
      <Panel hand="a" span={12}>
        <div className="grid gap-x-[46px] lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
          <div className="flex flex-col lg:self-center">
            {/* A tool page asks its own question. The picker goes with it: the
                URL already answered what to read, and a control that could
                change it would contradict the heading above it. */}
            <h1 className={H1}>{pinned === null ? <SiteQuestion /> : pinned.headline}</h1>

            <ScanBar examples={EXAMPLES} onScan={onScan} />

            {pinned === null ? (
              <div className="mt-7">
                <ToolPicker registry={TOOLS} selected={toolIds} onChange={onSelect} />
              </div>
            ) : null}
          </div>

          <aside className="mt-7 flex items-center self-stretch lg:mt-0">
            <HowItWorks labels={beats(pinned?.checks)} />
          </aside>
        </div>
      </Panel>
      {below}
    </PanelGrid>
  );
}

function Colophon(): JSX.Element {
  return (
    <footer className="mx-auto mt-auto w-full max-w-[76rem] px-4 pb-6 pt-5 lg:px-[26px] lg:pb-[34px] lg:pt-[26px]">
      <DrawnRule />
      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-10 gap-y-4">
        <ParentCredit />
        {/* Printed, not written: a legal notice is the one string here that is
            neither the product's voice nor its wordmark. The year is read, so
            the line cannot go stale every January. */}
        <p className="m-0 text-13 font-normal leading-[1.5] text-ink-3">
          © {new Date().getFullYear()} {PUBLISHER}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export function App(): JSX.Element {
  const { address, toolIds, pinned, chooser, board, pageName, open, select, clear } =
    useConsoleRoute();
  const tools = toolsById(TOOLS, toolIds);
  const analytics = useAnalytics();

  /**
   * The two things a visitor does before a reading exists, reported with what
   * they chose and never with what they typed. The address is somebody's site,
   * and sending it is a decision to take deliberately rather than by default.
   */
  const scan = (next: string): void => {
    analytics.capture(AnalyticsEvent.ScanSubmit, {
      tool_page: pageName,
      tools: toolIds.join(','),
      tool_count: toolIds.length,
    });
    open(next);
  };

  const choose = (ids: readonly string[]): void => {
    analytics.capture(AnalyticsEvent.ToolsSelect, {
      tool_page: pageName,
      tools: ids.join(','),
      tool_count: ids.length,
    });
    select(ids);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Masthead />
      {board ? (
        <LeaderboardView />
      ) : chooser ? (
        <ChooseView />
      ) : address === null ? (
        <AskView
          onScan={scan}
          toolIds={toolIds}
          onSelect={choose}
          pinned={pinned}
          // Each reading's own panel under the ask: the board is Slopmeter's,
          // the common issues are Leakpeek's, and the third has neither.
          below={belowAsk(pinned?.id, scan)}
        />
      ) : (
        // No picker here. What to read is asked once, before the reading; on the
        // report it was a control at the end of a page nobody scrolls to, for a
        // choice already made. `Read another site` is the way back to it.
        <ConsoleReport
          key={address}
          address={address}
          tools={tools}
          page={pageName}
          onNewSite={clear}
        />
      )}
      <Colophon />
    </div>
  );
}
