import {
  DrawnRule,
  HowItWorks,
  MarkReel,
  Panel,
  PanelGrid,
  ParentCredit,
  ParentWordmark,
  ScanBar,
  ThemeToggle,
  useTheme,
} from '@lumioguard/ui';
import { EXAMPLES, HEADLINE, HOW_IT_WORKS, NAME, PUBLISHER } from './copy.js';
import { ConsoleReport } from './features/report/ConsoleReport.js';
import { useConsoleRoute } from './features/scan/useConsoleRoute.js';
import { ToolPicker } from './features/select/ToolPicker.js';
import { TOOLS } from './tools/index.js';
import { toolsById } from './tools/registry.js';

function Masthead({ onHome, atHome }: { readonly onHome: () => void; readonly atHome: boolean }) {
  const { theme, toggle } = useTheme();

  return (
    <>
      <div className="mx-auto flex w-full max-w-[76rem] items-center gap-[13px] px-4 pt-5 lg:px-[26px]">
        <MarkReel />
        {/* Set lowercase rather than typed lowercase: the document keeps the
            real name, so a copy, a bookmark and a search engine all still get
            Readout spelled properly. */}
        <p className="m-0 flex items-baseline gap-[7px] font-hand text-24 lowercase tracking-wide">
          <ParentWordmark className="text-ink-2" />
          {atHome ? (
            <span className="text-ink-1">{NAME}</span>
          ) : (
            <button
              type="button"
              onClick={onHome}
              // `lowercase` again rather than inherited: a button does not take
              // the parent's text-transform, so the wordmark came out `Readout`
              // on the report and `readout` everywhere else.
              className="border-0 bg-transparent p-0 font-hand text-24 lowercase tracking-wide text-ink-1 transition-colors hover:text-hand"
            >
              {NAME}
            </button>
          )}
        </p>
        <ThemeToggle theme={theme} onToggle={toggle} className="ml-auto" />
      </div>
      <div className="mx-auto mt-[6px] w-full max-w-[76rem] px-4 lg:px-[26px]">
        <DrawnRule />
      </div>
    </>
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
}: {
  readonly onScan: (address: string) => void;
  readonly toolIds: readonly string[];
  readonly onSelect: (ids: readonly string[]) => void;
}): JSX.Element {
  return (
    <PanelGrid centred>
      <Panel hand="a" span={12}>
        <div className="grid gap-x-[46px] lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
          <div className="flex flex-col lg:self-center">
            <h1 className="m-0 max-w-[20ch] text-balance font-headline text-36 leading-[1.12] text-hand lg:text-48">
              {HEADLINE.lead} <span className="whitespace-nowrap">{HEADLINE.tail}</span>
            </h1>

            <ScanBar examples={EXAMPLES} onScan={onScan} />

            <div className="mt-7">
              <ToolPicker registry={TOOLS} selected={toolIds} onChange={onSelect} />
            </div>
          </div>

          <aside className="mt-7 flex items-center self-stretch lg:mt-0">
            <HowItWorks labels={HOW_IT_WORKS} />
          </aside>
        </div>
      </Panel>
    </PanelGrid>
  );
}

function Colophon(): JSX.Element {
  return (
    <footer className="mx-auto mt-auto flex w-full max-w-[76rem] flex-wrap items-end justify-between gap-x-10 gap-y-4 px-4 pb-6 pt-5 lg:px-[26px] lg:pb-[34px] lg:pt-[26px]">
      <p className="m-0 font-hand lowercase tracking-wide">
        <span className="block text-24 leading-[1.15] text-ink-1">{NAME}</span>
        <ParentCredit />
      </p>

      {/* Printed, not written, and not lowercased: a legal notice is the one
          string here that is neither the product's voice nor its wordmark.

          The year is read rather than typed. A copyright line that silently
          goes stale every January is exactly the kind of unattended default
          these tools exist to find on other people's sites. */}
      <p className="m-0 text-13 font-normal leading-[1.5] text-ink-3">
        © {new Date().getFullYear()} {PUBLISHER}. All rights reserved.
      </p>
    </footer>
  );
}

export function App(): JSX.Element {
  const { address, toolIds, open, select, clear } = useConsoleRoute();
  const tools = toolsById(TOOLS, toolIds);

  return (
    <div className="flex min-h-screen flex-col">
      <Masthead onHome={clear} atHome={address === null} />
      {address === null ? (
        <AskView onScan={open} toolIds={toolIds} onSelect={select} />
      ) : (
        // No picker here. What to read is asked once, before the reading; on the
        // report it was a control at the end of a page nobody scrolls to, for a
        // choice already made. `Read another site` is the way back to it.
        <ConsoleReport key={address} address={address} tools={tools} onNewSite={clear} />
      )}
      <Colophon />
    </div>
  );
}
