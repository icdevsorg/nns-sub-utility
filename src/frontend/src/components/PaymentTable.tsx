import type { PaymentRecord } from '../canister/subs';
import { PrincipalDisplay } from './PrincipalDisplay';

function formatAmount(amount: bigint, decimals = 8): string {
  const whole = amount / BigInt(10 ** decimals);
  const frac = amount % BigInt(10 ** decimals);
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
  return fracStr ? `${whole}.${fracStr}` : whole.toString();
}

function formatDate(ns: bigint): string {
  return new Date(Number(ns / 1_000_000n)).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PaymentTable({ payments }: { payments: PaymentRecord[] }) {
  if (payments.length === 0) {
    return <p className="text-slate-400 text-sm">No payments found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400 text-sm">
            <th className="py-2 px-3">ID</th>
            <th className="py-2 px-3">Date</th>
            <th className="py-2 px-3">Service</th>
            <th className="py-2 px-3 text-right">Amount</th>
            <th className="py-2 px-3">Sub ID</th>
            <th className="py-2 px-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.paymentId.toString()} className="border-b border-slate-800 text-sm">
              <td className="py-2 px-3 text-slate-300">#{p.paymentId.toString()}</td>
              <td className="py-2 px-3 text-slate-300">{formatDate(p.date)}</td>
              <td className="py-2 px-3">
                <PrincipalDisplay principal={p.service.toText()} />
              </td>
              <td className="py-2 px-3 text-right text-slate-200 font-mono">
                {formatAmount(p.amount)}
              </td>
              <td className="py-2 px-3 text-slate-400">#{p.subscriptionId.toString()}</td>
              <td className="py-2 px-3">
                {'Ok' in p.result ? (
                  <span className="text-emerald-400 text-xs">Success</span>
                ) : (
                  <span className="text-red-400 text-xs" title={p.result.Err.message}>
                    Error
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
