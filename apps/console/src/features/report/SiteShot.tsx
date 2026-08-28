import { mshotsUrl } from '@lumioguard/shared';
import { Panel, PanelHead, ResolvingShot } from '@lumioguard/ui';

/**
 * Console-level, not Slopmeter's: it is a picture of the address, true of the
 * whole reading. In one tool's section it vanished when that tool was not picked.
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
