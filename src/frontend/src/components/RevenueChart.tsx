import type { DailyRevenueEntry } from '@declarations/subs/subs.did.d.ts';

interface RevenueChartProps {
  data: DailyRevenueEntry[];
  decimals?: number;
  symbol?: string;
}

function dayKeyToDate(dayKey: bigint): string {
  // dayKey is days since epoch (Unix day number)
  const ms = Number(dayKey) * 86_400_000;
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function RevenueChart({ data, decimals = 8, symbol }: RevenueChartProps) {
  if (data.length === 0) {
    return <p className="text-slate-500 text-sm">No revenue data for this period.</p>;
  }

  const maxAmount = data.reduce((max, d) => (d.amount > max ? d.amount : max), 0n);
  const divisor = Math.pow(10, decimals);

  return (
    <div className="space-y-1">
      {data.map((entry) => {
        const pct = maxAmount > 0n ? Number((entry.amount * 100n) / maxAmount) : 0;
        const formatted = (Number(entry.amount) / divisor).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        });

        return (
          <div key={entry.dayKey.toString()} className="flex items-center gap-3 text-sm">
            <span className="w-16 text-right text-slate-500 text-xs shrink-0">
              {dayKeyToDate(entry.dayKey)}
            </span>
            <div className="flex-1 h-6 bg-slate-800 rounded overflow-hidden">
              <div
                className="h-full bg-emerald-600/60 rounded transition-all"
                style={{ width: `${Math.max(pct, 1)}%` }}
              />
            </div>
            <span className="w-28 text-right text-slate-300 font-mono text-xs shrink-0">
              {formatted} {symbol ?? ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}
