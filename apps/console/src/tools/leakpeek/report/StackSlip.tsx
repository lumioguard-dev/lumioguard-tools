import { drawnCycle } from '@lumioguard/design-tokens';
import type { DetectedStackDto } from '@lumioguard/shared';

/**
 * EACH TAG CARRIES ITS OWN LEAD-IN. One heading true of all three roles could only
 * be "built with", which then claimed a site was built with Cloudflare. The marks
 * are the surface's own ballpoint, never a brand logo.
 */

const PEN = {
  fill: 'none',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** The stroke is the page's, not the icon's: hold its weight at any size. */
const NS = 'non-scaling-stroke';

function MarkBuilder(): JSX.Element {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-[15px] w-[15px] stroke-pen-600"
      aria-hidden="true"
      {...PEN}
    >
      <path vectorEffect={NS} d="M3.8 16.4C6.9 13 10.2 9.8 13.6 6.6" />
      <g className="stroke-pen-700" strokeWidth={1.3}>
        <path vectorEffect={NS} d="M14.4 2.6c.2 1 .1 2-.2 3M12.4 4.7c1 .2 2 .1 3-.2" />
        <path vectorEffect={NS} d="M17.2 6.6c.2.7.1 1.5-.2 2.2M15.6 8.1c.7.2 1.5.1 2.2-.2" />
      </g>
    </svg>
  );
}

function MarkDatabase(): JSX.Element {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-[15px] w-[15px] stroke-pen-600"
      aria-hidden="true"
      {...PEN}
    >
      <path
        vectorEffect={NS}
        d="M4.4 5.4c0-1.3 2.5-2.3 5.6-2.3s5.6 1 5.6 2.3-2.5 2.3-5.6 2.3S4.4 6.7 4.4 5.4Z"
      />
      <path vectorEffect={NS} d="M4.4 5.4v9.2c0 1.3 2.5 2.3 5.6 2.3s5.6-1 5.6-2.3V5.4" />
      <path
        vectorEffect={NS}
        className="stroke-pen-700"
        opacity={0.8}
        d="M4.6 10c.2 1.2 2.6 2.2 5.4 2.2S15.2 11.2 15.4 10"
      />
    </svg>
  );
}

function MarkHosting(): JSX.Element {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-[15px] w-[15px] stroke-pen-600"
      aria-hidden="true"
      {...PEN}
    >
      <path
        vectorEffect={NS}
        d="M6 15.2c-2 0-3.4-1.7-3-3.6.3-1.3 1.4-2.2 2.7-2.3.3-2.2 2.1-3.8 4.3-3.7 1.8.1 3.3 1.3 3.8 3 .3-.1.7-.2 1-.1 1.7.1 2.9 1.6 2.6 3.3-.2 1.5-1.6 2.5-3.1 2.4H6Z"
      />
    </svg>
  );
}

interface Tag {
  readonly role: 'builder' | 'backend' | 'hosting';
  /** The relation, said plainly. Only `builder` earns "built with". */
  readonly lead: string;
  readonly name: string;
  readonly mark: JSX.Element;
}

export function StackSlip({ stack }: { readonly stack: DetectedStackDto }): JSX.Element | null {
  const tags: Tag[] = [];
  if (stack.builder !== null)
    tags.push({ role: 'builder', lead: 'built with', name: stack.builder, mark: <MarkBuilder /> });
  if (stack.backend !== null)
    tags.push({ role: 'backend', lead: 'data in', name: stack.backend, mark: <MarkDatabase /> });
  if (stack.hosting !== null)
    tags.push({ role: 'hosting', lead: 'served from', name: stack.hosting, mark: <MarkHosting /> });

  if (tags.length === 0) return null;

  return (
    // The gap BETWEEN pairs is wider than the gap inside one, or a lead-in floats
    // between two tags rather than belonging to the one on its right.
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {tags.map((tag, index) => (
        <span key={tag.role} className="inline-flex items-center gap-[7px]">
          <span className="font-hand text-14 lowercase tracking-wide text-ink-3">{tag.lead}</span>
          {/* From the token, not retyped: hand-written radii did not move when the
              drawn scale was retuned. */}
          <span
            className="inline-flex items-center gap-[7px] border-2 border-pen-700 bg-paper-high px-[11px] py-[4px]"
            style={{ borderRadius: drawnCycle[index % drawnCycle.length] }}
          >
            {tag.mark}
            <span className="font-sans text-14 font-medium leading-none text-ink-1">
              {tag.name}
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}
