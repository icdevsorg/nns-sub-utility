import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useSubscriptionDetail } from '../hooks/useSubscriptionDetail';
import { useUserPayments } from '../hooks/useUserPayments';
import { useTokenInfo } from '../hooks/useTokenInfo';
import { useCancelSubscription } from '../hooks/useCancelSubscription';
import { usePauseSubscription } from '../hooks/usePauseSubscription';
import { AuthGuard } from '../components/AuthGuard';
import { StatusBadge } from '../components/StatusBadge';
import { IntervalLabel } from '../components/IntervalLabel';
import { PrincipalDisplay } from '../components/PrincipalDisplay';
import { PaymentTable } from '../components/PaymentTable';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { buildPaymentTokenLabelBySubscriptionId } from '../utils/paymentTokens';

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

function SubscriptionDetailInner() {
  const { id } = useParams<{ id: string }>();
  const { identity, authMethod } = useAuth();
  const subscriptionId = BigInt(id ?? '0');

  const { data, isPending, isError } = useSubscriptionDetail({
    identity,
    authMethod,
    subscriptionId,
  });

  const { data: payments, isPending: paymentsLoading } = useUserPayments({
    identity,
    authMethod,
  });
  const { data: supportedTokens } = useTokenInfo();

  const cancelMutation = useCancelSubscription();
  const pauseMutation = usePauseSubscription();
  const isMutating = cancelMutation.isPending || pauseMutation.isPending;

  if (isPending) return <LoadingSpinner />;
  if (isError || !data?.subscription) {
    return <p className="text-red-400">Subscription not found or failed to load.</p>;
  }

  const sub = data.subscription;
  const pending = data.pending;
  const isActive = 'Active' in sub.status;
  const isPaused = 'Paused' in sub.status;

  // Filter payments for this subscription
  const subPayments = (payments ?? []).filter(
    (p) => p.subscriptionId === subscriptionId,
  );
  const tokenLabelBySubscriptionId = useMemo(
    () => buildPaymentTokenLabelBySubscriptionId([sub], supportedTokens),
    [sub, supportedTokens],
  );

  const handleCancel = () => {
    if (!identity && authMethod !== 'plug') return;
    cancelMutation.mutate({
      identity,
      authMethod,
      subscriptions: [{ subscriptionId, reason: 'Cancelled via web app' }],
    });
  };

  const handlePause = () => {
    if (!identity && authMethod !== 'plug') return;
    pauseMutation.mutate({
      identity,
      authMethod,
      items: [{ subscriptionId, active: false, reason: 'Paused via web app' }],
    });
  };

  const handleResume = () => {
    if (!identity && authMethod !== 'plug') return;
    pauseMutation.mutate({
      identity,
      authMethod,
      items: [{ subscriptionId, active: true, reason: 'Resumed via web app' }],
    });
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-3xl font-bold text-emerald-400">
          Subscription #{sub.subscriptionId.toString()}
        </h2>
        <StatusBadge status={sub.status} />
      </div>

      {/* Details grid */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400 block mb-1">Service Canister</span>
            <PrincipalDisplay principal={sub.serviceCanister.toText()} short={false} />
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Token Canister</span>
            <PrincipalDisplay principal={sub.tokenCanister.toText()} short={false} />
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Amount per Interval</span>
            <span className="text-slate-200 font-mono">{formatAmount(sub.amountPerInterval)}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Interval</span>
            <span className="text-slate-200"><IntervalLabel interval={sub.interval} /></span>
          </div>
          {sub.productId.length > 0 && (
            <div>
              <span className="text-slate-400 block mb-1">Product ID</span>
              <span className="text-slate-200">{sub.productId[0]!.toString()}</span>
            </div>
          )}
          {sub.endDate.length > 0 && (
            <div>
              <span className="text-slate-400 block mb-1">End Date</span>
              <span className="text-slate-200">{formatDate(sub.endDate[0]!)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Pending payment info */}
      {pending && (
        <div className="bg-slate-800 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">Next Payment</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {pending.nextPaymentDate.length > 0 && (
              <div>
                <span className="text-slate-400">Date:</span>
                <span className="text-slate-200 ml-2">{formatDate(pending.nextPaymentDate[0]!)}</span>
              </div>
            )}
            {pending.nextPaymentAmount.length > 0 && (
              <div>
                <span className="text-slate-400">Amount:</span>
                <span className="text-slate-200 ml-2 font-mono">
                  {formatAmount(pending.nextPaymentAmount[0]!)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {(isActive || isPaused) && (
        <div className="flex gap-3 mb-8">
          {isActive && (
            <button
              onClick={handlePause}
              disabled={isMutating}
              className="px-4 py-2 text-sm bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
            >
              Pause Subscription
            </button>
          )}
          {isPaused && (
            <button
              onClick={handleResume}
              disabled={isMutating}
              className="px-4 py-2 text-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
            >
              Resume Subscription
            </button>
          )}
          <button
            onClick={handleCancel}
            disabled={isMutating}
            className="px-4 py-2 text-sm bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            Cancel Subscription
          </button>
        </div>
      )}

      {/* Payment history */}
      <h3 className="text-xl font-semibold text-slate-200 mb-4">Payment History</h3>
      {paymentsLoading ? <LoadingSpinner /> : <PaymentTable payments={subPayments} tokenLabelBySubscriptionId={tokenLabelBySubscriptionId} />}
    </div>
  );
}

export function SubscriptionDetail() {
  return (
    <AuthGuard>
      <SubscriptionDetailInner />
    </AuthGuard>
  );
}
