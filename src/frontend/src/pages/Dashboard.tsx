import { useMetadata } from '../hooks/useMetadata';
import { useRecentBlocks, type BlockEntry } from '../hooks/useRecentBlocks';
import { useTokenInfo } from '../hooks/useTokenInfo';
import { useServiceLeaderboard } from '../hooks/useServiceLeaderboard';
import { StatCard } from '../components/StatCard';
import { PrincipalDisplay } from '../components/PrincipalDisplay';
import { LoadingSpinner } from '../components/LoadingSpinner';

function extractBlockType(block: unknown): string {
  if (block && typeof block === 'object' && 'Map' in (block as Record<string, unknown>)) {
    const map = (block as { Map: Array<[string, unknown]> }).Map;
    // Check for btype at top level (ICRC-3 standard)
    const btypeEntry = map.find(([k]) => k === 'btype');
    if (btypeEntry) {
      const btypeVal = btypeEntry[1];
      if (btypeVal && typeof btypeVal === 'object' && 'Text' in (btypeVal as Record<string, unknown>)) {
        return (btypeVal as { Text: string }).Text;
      }
    }
    // Fallback: check tx.op
    const txEntry = map.find(([k]) => k === 'tx');
    if (txEntry) {
      const txVal = txEntry[1];
      if (txVal && typeof txVal === 'object' && 'Map' in (txVal as Record<string, unknown>)) {
        const txMap = (txVal as { Map: Array<[string, unknown]> }).Map;
        const opEntry = txMap.find(([k]) => k === 'op');
        if (opEntry) {
          const opVal = opEntry[1];
          if (opVal && typeof opVal === 'object' && 'Text' in (opVal as Record<string, unknown>)) {
            return (opVal as { Text: string }).Text;
          }
        }
      }
    }
  }
  return 'unknown';
}

function formatBlockId(entry: BlockEntry): string {
  return `#${entry.id.toString()}`;
}

function getMetaValue(meta: Map<string, unknown>, key: string): string | null {
  const val = meta.get(key);
  if (!val) return null;
  if (typeof val === 'object' && val !== null && 'Nat' in (val as Record<string, unknown>)) {
    return (val as { Nat: bigint }).Nat.toString();
  }
  if (typeof val === 'object' && val !== null && 'Text' in (val as Record<string, unknown>)) {
    return (val as { Text: string }).Text;
  }
  return null;
}

export function Dashboard() {
  const { data: metadata, isPending: metaLoading, isError: metaError } = useMetadata();
  const { data: recentData, isPending: blocksLoading, isError: blocksError } = useRecentBlocks();
  const { data: tokenInfo, isPending: tokensLoading } = useTokenInfo();
  const { data: leaderboard, isPending: leaderboardLoading } = useServiceLeaderboard();

  return (
    <div>
      <h2 className="text-3xl font-bold text-emerald-400 mb-2">Dashboard</h2>
      <p className="text-slate-400 mb-8">
        Public overview of the ICRC-79 subscription canister.
      </p>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Total Blocks"
          value={recentData ? recentData.logLength.toString() : '0'}
          isLoading={blocksLoading}
          isError={blocksError}
        />
        <StatCard
          label="Supported Tokens"
          value={tokenInfo ? tokenInfo.length.toString() : '0'}
          isLoading={tokensLoading}
        />
        <StatCard
          label="Max Query Batch"
          value={metadata ? (getMetaValue(metadata, 'icrc79:max_query_batch_size') ?? '—') : '—'}
          isLoading={metaLoading}
          isError={metaError}
        />
        <StatCard
          label="Default Take"
          value={metadata ? (getMetaValue(metadata, 'icrc79:default_take_value') ?? '—') : '—'}
          isLoading={metaLoading}
          isError={metaError}
        />
      </div>

      {/* Token Info Table */}
      {tokenInfo && tokenInfo.length > 0 && (
        <section className="mb-10">
          <h3 className="text-xl font-semibold text-slate-200 mb-4">Supported Tokens</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-sm">
                  <th className="py-2 px-3">Symbol</th>
                  <th className="py-2 px-3">Canister</th>
                  <th className="py-2 px-3 text-right">Decimals</th>
                  <th className="py-2 px-3 text-right">Fee</th>
                  <th className="py-2 px-3">Standards</th>
                </tr>
              </thead>
              <tbody>
                {tokenInfo.map((t) => (
                  <tr key={t.tokenCanister.toText()} className="border-b border-slate-800 text-sm">
                    <td className="py-2 px-3 text-emerald-400 font-medium">{t.tokenSymbol}</td>
                    <td className="py-2 px-3 font-mono text-xs text-slate-300">{t.tokenCanister.toText()}</td>
                    <td className="py-2 px-3 text-right text-slate-300">{t.tokenDecimals}</td>
                    <td className="py-2 px-3 text-right text-slate-300">
                      {t.tokenFee.length > 0 ? t.tokenFee[0]!.toString() : '—'}
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-xs">{t.standards.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Service Leaderboard */}
      <section className="mb-10">
        <h3 className="text-xl font-semibold text-slate-200 mb-4">Top Services by Revenue</h3>
        {leaderboardLoading ? (
          <LoadingSpinner />
        ) : leaderboard && leaderboard.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-sm">
                  <th className="py-2 px-3 text-right w-12">#</th>
                  <th className="py-2 px-3">Service</th>
                  <th className="py-2 px-3 text-right">Total Revenue</th>
                  <th className="py-2 px-3 text-right">Active Subs</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => (
                  <tr key={entry.service.toText()} className="border-b border-slate-800 text-sm">
                    <td className="py-2 px-3 text-right text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-3"><PrincipalDisplay principal={entry.service.toText()} /></td>
                    <td className="py-2 px-3 text-right text-emerald-400 font-mono">
                      {(Number(entry.totalRevenue) / 1e8).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-300">{entry.activeSubscriptions.toString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500">No service data yet.</p>
        )}
      </section>

      {/* Recent Activity */}
      <section>
        <h3 className="text-xl font-semibold text-slate-200 mb-4">Recent Blocks</h3>
        {blocksLoading ? (
          <LoadingSpinner />
        ) : blocksError ? (
          <p className="text-red-400">Failed to load recent blocks — retrying...</p>
        ) : recentData && recentData.blocks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-sm">
                  <th className="py-2 px-3">Block</th>
                  <th className="py-2 px-3">Type</th>
                </tr>
              </thead>
              <tbody>
                {[...recentData.blocks].reverse().map((entry) => (
                  <tr key={String(entry.id)} className="border-b border-slate-800 text-sm">
                    <td className="py-2 px-3 text-emerald-400 font-mono">{formatBlockId(entry)}</td>
                    <td className="py-2 px-3 text-slate-300">{extractBlockType(entry.block)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500">No blocks yet.</p>
        )}
      </section>
    </div>
  );
}
