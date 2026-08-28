import { parseAddress } from '@lumioguard/shared';

export function Subject({ address }: { readonly address: string }): JSX.Element {
  const parsed = parseAddress(address);

  if (!parsed.ok) {
    return <span className="break-words font-sans text-18 text-ink-1">{address}</span>;
  }

  return (
    <a
      href={parsed.value.url}
      target="_blank"
      rel="noreferrer noopener"
      className="break-words font-sans text-18 font-medium text-ink-1 underline decoration-pen-600 decoration-1 underline-offset-[4px] transition-colors hover:text-hand hover:decoration-hand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pen-400"
    >
      {parsed.value.address}
    </a>
  );
}
