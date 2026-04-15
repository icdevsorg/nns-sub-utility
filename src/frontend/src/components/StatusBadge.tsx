import type { SubStatus } from '../canister/subs';

function getStatusInfo(status: SubStatus): { label: string; color: string } {
  if ('Active' in status) return { label: 'Active', color: 'bg-emerald-500/20 text-emerald-400' };
  if ('Paused' in status) return { label: 'Paused', color: 'bg-yellow-400/20 text-yellow-400' };
  if ('WillCancel' in status) return { label: 'Cancelling', color: 'bg-red-400/20 text-red-400' };
  if ('Canceled' in status) return { label: 'Cancelled', color: 'bg-slate-500/20 text-slate-400' };
  return { label: 'Unknown', color: 'bg-slate-500/20 text-slate-400' };
}

export function StatusBadge({ status }: { status: SubStatus }) {
  const { label, color } = getStatusInfo(status);
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
