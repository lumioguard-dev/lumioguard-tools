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
export function SiteShot({ address }: { readonly address: string }): JSX.Element | null {
  const src = mshotsUrl(address);
  if (src === null) return null;

  return (
    <Panel hand="d" span={7}>
      <PanelHead title="See it for yourself" />
      {/* `resolving` is false because this is drawn only once every reading has
          landed. The sampling animation exists to fill a wait that is over. */}
      <ResolvingShot src={src} alt={`Render of ${address}`} address={address} resolving={false} />
    </Panel>
  );
}
