import { GAP_BELOW_ASK, MarkExposed, Panel, PanelHead } from '@lumioguard/ui';
import { KNOWN_ISSUES, type KnownIssue } from './knownIssues.js';

function Issue({ issue }: { readonly issue: KnownIssue }): JSX.Element {
  return (
    <li className="border-b border-pen-900 py-[15px] last:border-b-0 last:pb-0">
      <span className="block text-body leading-[1.3] text-ink-1">{issue.title}</span>
      {/* No width cap: capped at 92ch the second line wrapped short of the frame
          and read as a column inside a panel. */}
      <span className="mt-[6px] block text-caption leading-[1.6] text-ink-3">{issue.detail}</span>
    </li>
  );
}

/** `knownIssues.ts` says where these came from, and why they are not what this checks. */
export function CommonIssues(): JSX.Element {
  return (
    <Panel hand="c" span={12} className={GAP_BELOW_ASK}>
      <PanelHead title="Common Security Failures in AI-Built Apps" mark={<MarkExposed />} />
      <ol className="m-0 mt-4 list-none p-0">
        {KNOWN_ISSUES.map((issue) => (
          <Issue key={issue.title} issue={issue} />
        ))}
      </ol>
    </Panel>
  );
}
