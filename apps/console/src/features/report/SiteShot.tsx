import { mshotsUrl } from '@lumioguard/shared';
import { Panel, PanelHead, ResolvingShot } from '@lumioguard/ui';

/**
 * A render of the site under examination.
 *
 * Console-level, not Slopmeter's. It is a picture of the address, which is true
 * of the whole reading rather than of any one tool, and while it lived in
 * Slopmeter's section it appeared or vanished depending on whether that one
 * tool had been selected.
 */
export function SiteShot({
  address,
  resolving,
}: {
  readonly address: string;
  /** True while any reading is still running: the render samples up as it waits. */
  readonly resolving: boolean;
}): JSX.Element | null {
  const src = mshotsUrl(address);
  if (src === null) return null;

  return (
    <Panel hand="d" span={7}>
      <PanelHead title="See it for yourself" />
      <ResolvingShot
        src={src}
        alt={`Render of ${address}`}
        address={address}
        resolving={resolving}
      />
    </Panel>
  );
}
