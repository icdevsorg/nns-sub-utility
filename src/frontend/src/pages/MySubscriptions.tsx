import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useUserSubscriptions } from '../hooks/useUserSubscriptions';
import { useCancelSubscription } from '../hooks/useCancelSubscription';
import { usePauseSubscription } from '../hooks/usePauseSubscription';
import { SubscriptionCard } from '../components/SubscriptionCard';
import { AuthGuard } from '../components/AuthGuard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { SubStatusFilter } from '@declarations/subs/subs.did.d.ts';
import { CONFIG } from '../config';

const STATUS_FILTERS: { label: string; value: SubStatusFilter | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Active', value: { Active: null } },
  { label: 'Paused', value: { Paused: null } },
  { label: 'Cancelling', value: { WillCancel: null } },
  { label: 'Cancelled', value: { Canceled: null } },
];

function MySubscriptionsInner() {
  const { identity, authMethod } = useAuth();
  const [statusFilter, setStatusFilter] = useState<SubStatusFilter | undefined>(undefined);
  const [page, setPage] = useState(0);

  const prev = page > 0 ? BigInt(page * CONFIG.PAGE_SIZE) : undefined;
  const { data: subs, isPending, isError } = useUserSubscriptions({
    identity,
    authMethod,
    statusFilter,
    prev,
  });

  const cancelMutation = useCancelSubscription();
  const pauseMutation = usePauseSubscription();
  const isMutating = cancelMutation.isPending || pauseMutation.isPending;

  const handleCancel = (subscriptionId: bigint) => {
    if (!identity && authMethod !== 'plug') return;
    cancelMutation.mutate({
      identity,
      authMethod,
      subscriptions: [{ subscriptionId, reason: 'Cancelled via web app' }],
    });
  };

  const handlePause = (subscriptionId: bigint) => {
    if (!identity && authMethod !== 'plug') return;
    pauseMutation.mutate({
      identity,
      authMethod,
      items: [{ subscriptionId, active: false, reason: 'Paused via web app' }],
    });
  };

  const handleResume = (subscriptionId: bigint) => {
    if (!identity && authMethod !== 'plug') return;
    pauseMutation.mutate({
      identity,
      authMethod,
      items: [{ subscriptionId, active: true, reason: 'Resumed via web app' }],
    });
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-emerald-400 mb-2">My Subscriptions</h2>
      <p className="text-slate-400 mb-6">View and manage your ICRC-79 subscriptions.</p>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => { setStatusFilter(f.value); setPage(0); }}
            className={`px-3 py-1.5 text-sm rounded border transition-colors ${
              (statusFilter === undefined && f.value === undefined) ||
              (statusFilter && f.value && JSON.stringify(statusFilter) === JSON.stringify(f.value))
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isPending && <LoadingSpinner />}
      {isError && <p className="text-red-400">Failed to load subscriptions.</p>}

      {subs && subs.length === 0 && (
        <p className="text-slate-400">No subscriptions found.</p>
      )}

      {subs && subs.length > 0 && (
        <div className="grid gap-4">
          {subs.map((sub) => (
            <SubscriptionCard
              key={sub.subscriptionId.toString()}
              subscription={sub}
              onPause={() => handlePause(sub.subscriptionId)}
              onResume={() => handleResume(sub.subscriptionId)}
              onCancel={() => handleCancel(sub.subscriptionId)}
              isPending={isMutating}
            />
          ))}
        </div>
      )}

      {/* Simple pagination */}
      {subs && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            ← Previous
          </button>
          <span className="text-sm text-slate-400">Page {page + 1}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={subs.length < CONFIG.PAGE_SIZE}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export function MySubscriptions() {
  return (
    <AuthGuard>
      <MySubscriptionsInner />
    </AuthGuard>
  );
}
