import { useMemo, useState } from 'react';
import { useTransactionBlocks, type BlockEntry } from '../hooks/useTransactionBlocks';
import { useTokenInfo } from '../hooks/useTokenInfo';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PaginationBar } from '../components/PaginationBar';
import { TokenPrincipalDisplay } from '../components/TokenPrincipalDisplay';
import { CONFIG } from '../config';
import { safeStringify } from '../utils/safeStringify';

/* ── Value helpers ──────────────────────────── */

type ValueNode = Record<string, unknown>;

function isMap(v: unknown): v is { Map: Array<[string, unknown]> } {
  return !!v && typeof v === 'object' && 'Map' in (v as ValueNode);
}

function extractBlockType(block: unknown): string {
  if (isMap(block)) {
    const btypeEntry = block.Map.find(([k]) => k === 'btype');
    if (btypeEntry) {
      const v = btypeEntry[1] as ValueNode;
      if ('Text' in v) return (v as { Text: string }).Text;
    }
    const txEntry = block.Map.find(([k]) => k === 'tx');
    if (txEntry && isMap(txEntry[1])) {
      const opEntry = (txEntry[1] as { Map: Array<[string, unknown]> }).Map.find(([k]) => k === 'op');
      if (opEntry) {
        const v = opEntry[1] as ValueNode;
        if ('Text' in v) return (v as { Text: string }).Text;
      }
    }
  }
  return 'unknown';
}

function extractMapValue(block: unknown, ...path: string[]): string | null {
  let current = block;
  for (const key of path) {
    if (isMap(current)) {
      const entry = current.Map.find(([k]) => k === key);
      if (!entry) return null;
      current = entry[1];
    } else {
      return null;
    }
  }
  if (current && typeof current === 'object') {
    const v = current as ValueNode;
    if ('Nat' in v) return (v as { Nat: bigint }).Nat.toString();
    if ('Int' in v) return (v as { Int: bigint }).Int.toString();
    if ('Text' in v) return (v as { Text: string }).Text;
    if ('Blob' in v) return '[blob]';
    if ('Array' in v) return `[${(v as { Array: unknown[] }).Array.length} items]`;
  }
  return null;
}

function extractMapNode(block: unknown, ...path: string[]): unknown | null {
  let current = block;
  for (const key of path) {
    if (isMap(current)) {
      const entry = current.Map.find(([k]) => k === key);
      if (!entry) return null;
      current = entry[1];
    } else {
      return null;
    }
  }
  return current;
}

function formatTimestamp(ns: string | null): string {
  if (!ns) return '—';
  try {
    const ms = Number(BigInt(ns) / 1_000_000n);
    return new Date(ms).toLocaleString();
  } catch {
    return ns;
  }
}

function valueToString(v: unknown): string {
  if (!v || typeof v !== 'object') return String(v ?? '');
  const node = v as ValueNode;
  if ('Nat' in node) return (node as { Nat: bigint }).Nat.toString();
  if ('Int' in node) return (node as { Int: bigint }).Int.toString();
  if ('Text' in node) return (node as { Text: string }).Text;
  if ('Blob' in node) return '[blob]';
  if ('Array' in node) return `[${(node as { Array: unknown[] }).Array.length} items]`;
  if ('Map' in node) return `{${(node as { Map: Array<[string, unknown]> }).Map.length} fields}`;
  return safeStringify(v);
}

/* ── Pretty labels for known fields ─────────── */

const FIELD_LABELS: Record<string, string> = {
  op: 'Operation',
  btype: 'Block Type',
  ts: 'Timestamp',
  amt: 'Amount',
  amount: 'Amount',
  sid: 'Subscription ID',
  subscriptionId: 'Subscription ID',
  pid: 'Payment ID',
  paymentId: 'Payment ID',
  fee: 'Fee',
  from: 'From',
  to: 'To',
  spender: 'Spender',
  memo: 'Memo',
  tid: 'Transaction ID',
  ltid: 'Ledger Tx ID',
  ledgerTransactionId: 'Ledger Tx ID',
  ftid: 'Fee Tx ID',
  feeTransactionId: 'Fee Tx ID',
  btid: 'Broker Tx ID',
  brokerTransactionId: 'Broker Tx ID',
  svc: 'Service',
  serviceCanister: 'Service',
  tok: 'Token',
  tokenCanister: 'Token',
  intv: 'Interval',
  reason: 'Reason',
  cancelReason: 'Cancel Reason',
  canceller: 'Cancelled By',
  canceledAt: 'Cancelled At',
  owner: 'Owner',
  subaccount: 'Subaccount',
  interval: 'Interval',
  product: 'Product ID',
  prodid: 'Product ID',
  productId: 'Product ID',
  end: 'End Date',
  endDate: 'End Date',
  bkr: 'Broker',
  brokerId: 'Broker',
  tgt: 'Target Account',
  targetAccount: 'Target Account',
  active: 'Active',
  bfee: 'Broker Fee',
  brokerFee: 'Broker Fee',
  rate: 'Exchange Rate',
  date: 'Date',
  amountPerInterval: 'Amount Per Interval',
  account: 'Account',
  phash: 'Parent Hash',
  createdAt: 'Created At',
};

function prettyLabel(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

const BLOCK_TYPE_BADGES: Record<string, { label: string; color: string }> = {
  '79subscribe': { label: 'Subscribe', color: 'bg-emerald-500/20 text-emerald-400' },
  '79payment': { label: 'Payment', color: 'bg-blue-500/20 text-blue-400' },
  '79cancel': { label: 'Cancel', color: 'bg-red-500/20 text-red-400' },
  '79subCancel': { label: 'Cancel', color: 'bg-red-500/20 text-red-400' },
  '79pause': { label: 'Pause', color: 'bg-amber-500/20 text-amber-400' },
  '79subPause': { label: 'Pause', color: 'bg-amber-500/20 text-amber-400' },
  '79confirm': { label: 'Confirm', color: 'bg-purple-500/20 text-purple-400' },
};

/* ── Recursive detail renderer ──────────────── */

function DetailValue({
  value,
  depth = 0,
  fieldKey,
  tokenSymbolByCanister,
}: {
  value: unknown;
  depth?: number;
  fieldKey?: string;
  tokenSymbolByCanister: Record<string, string>;
}) {
  if (!value || typeof value !== 'object') return <span>{String(value ?? '—')}</span>;

  const node = value as ValueNode;

  if ('Nat' in node) {
    const n = (node as { Nat: bigint }).Nat;
    // Detect nanosecond timestamps (> 1e18)
    if (n > 1_000_000_000_000_000n) {
      return <span className="font-mono">{formatTimestamp(n.toString())}</span>;
    }
    return <span className="font-mono">{n.toString()}</span>;
  }
  if ('Int' in node) return <span className="font-mono">{(node as { Int: bigint }).Int.toString()}</span>;
  if ('Text' in node) {
    const text = (node as { Text: string }).Text;
    if ((fieldKey === 'tok' || fieldKey === 'tokenCanister') && text.length > 0) {
      return (
        <TokenPrincipalDisplay
          principal={text}
          symbol={tokenSymbolByCanister[text]}
        />
      );
    }
    return <span className="text-slate-200">{text}</span>;
  }
  if ('Blob' in node) {
    const blob = (node as { Blob: Uint8Array | number[] }).Blob;
    const hex = Array.from(blob).map(b => b.toString(16).padStart(2, '0')).join('');
    return <span className="font-mono text-xs text-slate-400" title={hex}>{hex.length > 32 ? hex.slice(0, 32) + '...' : hex || '(empty)'}</span>;
  }

  if (isMap(node) && depth < 3) {
    return (
      <div className={depth > 0 ? 'ml-4 border-l border-slate-700 pl-3' : ''}>
        {node.Map.map(([k, v]) => (
          <div key={k} className="flex gap-2 py-0.5 text-xs">
            <span className="text-slate-500 shrink-0 min-w-[100px]">{prettyLabel(k)}:</span>
            <DetailValue value={v} depth={depth + 1} fieldKey={k} tokenSymbolByCanister={tokenSymbolByCanister} />
          </div>
        ))}
      </div>
    );
  }

  if ('Array' in node) {
    const arr = (node as { Array: unknown[] }).Array;
    if (arr.length === 0) return <span className="text-slate-500">[]</span>;
    if (arr.length <= 3 && depth < 3) {
      return (
        <div className="ml-4 border-l border-slate-700 pl-3">
          {arr.map((item, i) => (
            <div key={i} className="py-0.5 text-xs">
              <DetailValue value={item} depth={depth + 1} tokenSymbolByCanister={tokenSymbolByCanister} />
            </div>
          ))}
        </div>
      );
    }
    return <span className="text-slate-500">[{arr.length} items]</span>;
  }

  return <span className="text-slate-500">{valueToString(value)}</span>;
}

/* ── Transaction Row ────────────────────────── */

function TransactionRow({ entry, tokenSymbolByCanister }: { entry: BlockEntry; tokenSymbolByCanister: Record<string, string> }) {
  const [expanded, setExpanded] = useState(false);
  const block = entry.block;
  const blockType = extractBlockType(block);
  const ts = extractMapValue(block, 'ts') ?? extractMapValue(block, 'tx', 'ts');
  const amount = extractMapValue(block, 'tx', 'amt') ?? extractMapValue(block, 'tx', 'amount');
  const subId = extractMapValue(block, 'tx', 'sid') ?? extractMapValue(block, 'tx', 'subscriptionId');
  const tokenCanister = extractMapValue(block, 'tx', 'tok') ?? extractMapValue(block, 'tx', 'tokenCanister');
  const badge = BLOCK_TYPE_BADGES[blockType];

  // Get the tx node for the detail view
  const txNode = extractMapNode(block, 'tx');
  const topMap = isMap(block) ? block.Map.filter(([k]) => k !== 'tx') : [];

  return (
    <>
      <tr
        className="border-b border-slate-800 text-sm hover:bg-slate-800/50 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-2 px-3 text-emerald-400 font-mono">#{entry.id.toString()}</td>
        <td className="py-2 px-3">
          {badge ? (
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}>
              {badge.label}
            </span>
          ) : (
            <span className="text-slate-300">{blockType}</span>
          )}
        </td>
        <td className="py-2 px-3 text-slate-300 text-sm">
          {tokenCanister ? (tokenSymbolByCanister[tokenCanister] ?? tokenCanister) : '—'}
        </td>
        <td className="py-2 px-3 text-slate-300 text-right font-mono">{amount ?? '—'}</td>
        <td className="py-2 px-3 text-slate-400 text-xs">{formatTimestamp(ts)}</td>
        <td className="py-2 px-3 text-slate-400 font-mono text-xs">{subId ? `#${subId}` : '—'}</td>
        <td className="py-2 px-3 text-slate-500 text-xs">
          <span className={`transition-transform inline-block ${expanded ? 'rotate-90' : ''}`}>▶</span>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-slate-800">
          <td colSpan={6} className="px-3 py-3 bg-slate-900/60">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top-level fields (btype, ts, phash, etc.) */}
              {topMap.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">Block</h5>
                  {topMap.map(([k, v]) => (
                    <div key={k} className="flex gap-2 py-0.5 text-xs">
                      <span className="text-slate-500 shrink-0 min-w-[100px]">{prettyLabel(k)}:</span>
                      <DetailValue value={v} fieldKey={k} tokenSymbolByCanister={tokenSymbolByCanister} />
                    </div>
                  ))}
                </div>
              )}
              {/* Tx fields */}
              {isMap(txNode) && (
                <div>
                  <h5 className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">Transaction</h5>
                  {(txNode as { Map: Array<[string, unknown]> }).Map.map(([k, v]) => (
                    <div key={k} className="flex gap-2 py-0.5 text-xs">
                      <span className="text-slate-500 shrink-0 min-w-[100px]">{prettyLabel(k)}:</span>
                      <DetailValue value={v} fieldKey={k} tokenSymbolByCanister={tokenSymbolByCanister} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function Transactions() {
  const [page, setPage] = useState(0);
  const { data, isPending, isError } = useTransactionBlocks(page);
  const { data: supportedTokens } = useTokenInfo();

  const tokenSymbolByCanister = useMemo(
    () => Object.fromEntries((supportedTokens ?? []).map((token) => [token.tokenCanister.toText(), token.tokenSymbol])),
    [supportedTokens],
  );

  const totalPages = data
    ? Math.ceil(Number(data.logLength) / CONFIG.TRANSACTIONS_PAGE_SIZE)
    : 0;

  return (
    <div>
      <h2 className="text-3xl font-bold text-emerald-400 mb-2">Transactions</h2>
      <p className="text-slate-400 mb-6">
        ICRC-3 block explorer — browse all transactions on the subscription canister.
      </p>

      {isPending ? (
        <LoadingSpinner />
      ) : isError ? (
        <p className="text-red-400">Failed to load transactions — retrying...</p>
      ) : data && data.blocks.length > 0 ? (
        <>
          <p className="text-sm text-slate-500 mb-4">
            Total blocks: {data.logLength.toString()}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-sm">
                  <th className="py-2 px-3">Block</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Token</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Sub ID</th>
                  <th className="py-2 px-3 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {data.blocks.map((entry) => (
                  <TransactionRow key={String(entry.id)} entry={entry} tokenSymbolByCanister={tokenSymbolByCanister} />
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <p className="text-slate-500">No transactions found.</p>
      )}
    </div>
  );
}
