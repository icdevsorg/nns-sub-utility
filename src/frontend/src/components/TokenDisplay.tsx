import { useTokenMetadata, type TokenMetadata } from '../hooks/useTokenMetadata';

interface TokenDisplayProps {
  canisterId: string;
  showCanisterId?: boolean;
  metadata?: TokenMetadata | null;
}

export function TokenDisplay({ canisterId, showCanisterId, metadata }: TokenDisplayProps) {
  const { data: fetchedMeta, isPending } = useTokenMetadata(canisterId, {
    enabled: !metadata,
    initialData: metadata ?? null,
  });
  const meta = metadata ?? fetchedMeta;

  if (isPending) {
    return <span className="text-slate-500 animate-pulse">Loading...</span>;
  }

  if (!meta) {
    return <span className="font-mono text-xs text-slate-400">{canisterId}</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-emerald-400 font-medium">{meta.symbol}</span>
      <span className="text-slate-400 text-sm">({meta.name})</span>
      {showCanisterId && (
        <span className="font-mono text-xs text-slate-500">{canisterId}</span>
      )}
    </span>
  );
}
