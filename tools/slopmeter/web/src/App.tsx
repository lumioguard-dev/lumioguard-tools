import { HowItWorks, ParentCredit, ParentWordmark, ScanBar } from '@lumioguard/ui';
import { DrawnRule, MarkReel, Panel, PanelGrid, ThemeToggle, useTheme } from '@lumioguard/ui';
import { ResultsView } from './features/report/ResultsView.js';

import { useSiteRoute } from './features/scan/useSiteRoute.js';

/**
 * One lockup rather than a name at each end of the bar: the parent, then the
 * product, in the hand the whole surface is written in.
 */
/** The three beats, in this tool's own words. */
/** Sites this audience knows; their verdicts are the positioning. */
const EXAMPLES = ['lovable.dev', 'stripe.com', 'supabase.com'];

const HOW_IT_WORKS = {
  paste: 'Paste a URL',
  read: 'It reads the site for slop',
  result: 'See the score, and why',
};

function Masthead({ onHome, atHome }: { readonly onHome: () => void; readonly atHome: boolean }) {
  const { theme, toggle } = useTheme();

  return (
    <>
      <div className="mx-auto flex w-full max-w-[76rem] items-center gap-[13px] px-4 pt-5 lg:px-[26px]">
        <MarkReel />
        {/* Set lowercase rather than typed lowercase: the document keeps the
            real name, so a copy, a bookmark and a search engine all still get
            Slopmeter spelled properly. */}
        <p className="m-0 flex items-baseline gap-[7px] font-hand text-24 lowercase tracking-wide">
          <ParentWordmark className="text-ink-2" />
          {atHome ? (
            <span className="text-ink-1">Slopmeter</span>
          ) : (
            <button
              type="button"
              onClick={onHome}
              // `lowercase` again rather than inherited: a button does not take
              // the parent's text-transform, so the wordmark came out `Slopmeter`
              // on the report and `slopmeter` everywhere else
              className="border-0 bg-transparent p-0 font-hand text-24 lowercase tracking-wide text-ink-1 transition-colors hover:text-hand"
            >
              Slopmeter
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
function AskView({ onScan }: { readonly onScan: (address: string) => void }): JSX.Element {
  return (
    <PanelGrid centred>
      <Panel hand="a" span={12}>
        <div className="grid gap-x-[46px] lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
          {/* One column, spaced by its own margins. It used to be five grid rows
              so a brace could meet the field and the button exactly; the brace
              now runs the whole height, and with the rows gone the sketch stops
              paying out its extra height into every gap on this side. Centred,
              because the ask is shorter than the drawing beside it. */}
          <div className="flex flex-col lg:self-center">
            {/* `this site` is kept whole: the measure broke it across lines,
                which reads as a stumble in the one sentence the page leads
                with. With the phrase atomic the only remaining breaks are at
                phrase boundaries, and balance evens what is left. */}
            <h1 className="m-0 max-w-[17ch] text-balance font-hand text-36 leading-[1.12] text-hand lg:text-48">
              How much of <span className="whitespace-nowrap">this site</span> looks like slop?
            </h1>

            <ScanBar examples={EXAMPLES} onScan={onScan} />
          </div>

          {/* No brace any more: the steps run their own dashed spine down the
              column, and two vertical rules 26px apart is furniture. */}
          <aside className="mt-7 flex items-center self-stretch lg:mt-0">
            <HowItWorks labels={HOW_IT_WORKS} />
          </aside>
        </div>
      </Panel>
    </PanelGrid>
  );
}

/** The wordmark at one end and the legal line at the other. */
function Colophon(): JSX.Element {
  return (
    <footer className="mx-auto mt-auto flex w-full max-w-[76rem] flex-wrap items-end justify-between gap-x-10 gap-y-4 px-4 pb-6 pt-5 lg:px-[26px] lg:pb-[34px] lg:pt-[26px]">
      <p className="m-0 font-hand lowercase tracking-wide">
        <span className="block text-24 leading-[1.15] text-ink-1">Slopmeter</span>
        <ParentCredit />
      </p>

      {/* Printed, not written, and not lowercased: a legal notice is the one
          string here that is neither the product's voice nor its wordmark.

          The year is read rather than typed. A copyright line that silently
          goes stale every January is a tell this engine charges other pages
          for, and it would be charging from its own footer. */}
      <p className="m-0 text-13 font-normal leading-[1.5] text-ink-3">
        © {new Date().getFullYear()} Lumio Software FZ LLC. All rights reserved.
      </p>
    </footer>
  );
}

export function App(): JSX.Element {
  const { address, showPages, open, clear, openPages, closePages } = useSiteRoute();

  return (
    <div className="flex min-h-screen flex-col">
      <Masthead onHome={clear} atHome={address === null} />
      {address === null ? (
        <AskView onScan={open} />
      ) : (
        <ResultsView
          key={address}
          address={address}
          showPages={showPages}
          onOpenPages={openPages}
          onClosePages={closePages}
          onNewSite={clear}
        />
      )}
      <Colophon />
    </div>
  );
}
