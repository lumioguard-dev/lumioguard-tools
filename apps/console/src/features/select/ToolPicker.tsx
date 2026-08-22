import { drawnCycle } from '@lumioguard/design-tokens';
import { Hint, MarkTick } from '@lumioguard/ui';
import type { ToolRegistry } from '../../tools/registry.js';

/**
 * Which readings to run, all on until turned off. Real checkboxes, hidden with
 * the label as the target, so a screen reader and the keyboard get the control
 * they expect. The last one on cannot be turned off.
 */
export function ToolPicker({
  registry,
  selected,
  onChange,
}: {
  readonly registry: ToolRegistry;
  readonly selected: readonly string[];
  readonly onChange: (ids: readonly string[]) => void;
}): JSX.Element {
  const isLast = selected.length === 1;

  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-[11px] p-0 font-hand text-16 lowercase tracking-wide text-ink-3">
        What to read
      </legend>
      <div className="flex flex-wrap gap-[9px]">
        {registry.map((tool, index) => {
          const on = selected.includes(tool.id);
          const locked = on && isLast;
          return (
            <Hint key={tool.id} text={tool.summary}>
              {(describedBy) => (
                <label
                  className={`inline-flex cursor-pointer items-center gap-[9px] border-2 px-[13px] py-[7px] transition-colors ${
                    on
                      ? 'border-pen-300 bg-paper-high text-ink-1'
                      : 'border-pen-700/50 bg-transparent text-ink-3 hover:border-pen-600'
                  } ${locked ? 'cursor-default' : ''}`}
                  style={{ borderRadius: drawnCycle[index % drawnCycle.length] }}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    aria-describedby={describedBy}
                    checked={on}
                    disabled={locked}
                    onChange={() => {
                      onChange(
                        on ? selected.filter((id) => id !== tool.id) : [...selected, tool.id],
                      );
                    }}
                  />
                  {/* The mark leads and the name follows, because the mark is
                      the state: it was a word after the name ("on" / "off"),
                      which put the answer at the far end of a chip whose length
                      changes with the name on it. */}
                  <MarkTick on={on} />
                  <span className="font-sans text-15 font-medium leading-none">{tool.label}</span>
                </label>
              )}
            </Hint>
          );
        })}
      </div>
    </fieldset>
  );
}
