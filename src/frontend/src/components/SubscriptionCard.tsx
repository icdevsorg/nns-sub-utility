import { Link } from 'react-router-dom';
import type { Subscription } from '../canister/subs';
import { StatusBadge } from './StatusBadge';
import { IntervalLabel } from './IntervalLabel';
import { PrincipalDisplay } from './PrincipalDisplay';

interface SubscriptionCardProps {
  subscription: Subscription;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  isPending?: boolean;
}

function formatAmount(amount: bigint, decimals = 8): string {
  const whole = amount / BigInt(10 ** decimals);
  const frac = amount % BigInt(10 ** decimals);
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
  return fracStr ? `${whole}.${fracStr}` : whole.toString();
}

export function SubscriptionCard({ subscription, onPause, onResume, onCancel, isPending }: SubscriptionCardProps) {
  const isActive = 'Active' in subscription.status;
  const isPaused = 'Paused' in subscription.status;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Link
          to={`/subscriptions/${subscription.subscriptionId.toString()}`}
          className="text-emerald-400 font-semibold hover:underline"
        >
          #{subscription.subscriptionId.toString()}
        </Link>
        <StatusBadge status={subscription.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-slate-400">Service:</span>
          <div><PrincipalDisplay principal={subscription.serviceCanister.toText()} /></div>
        </div>
        <div>
          <span className="text-slate-400">Token:</span>
          <div><PrincipalDisplay principal={subscription.tokenCanister.toText()} /></div>
        </div>
        <div>
          <span className="text-slate-400">Amount:</span>
          <div className="text-slate-200">{formatAmount(subscription.amountPerInterval)}</div>
        </div>
        <div>
          <span className="text-slate-400">Interval:</span>
          <div className="text-slate-200"><IntervalLabel interval={subscription.interval} /></div>
        </div>
        {subscription.productId.length > 0 && (
          <div>
            <span className="text-slate-400">Product:</span>
            <div className="text-slate-200">{subscription.productId[0]!.toString()}</div>
          </div>
        )}
      </div>

      {(isActive || isPaused) && (
        <div className="flex gap-2 mt-1">
          {isActive && onPause && (
            <button
              onClick={onPause}
              disabled={isPending}
              className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
            >
              Pause
            </button>
          )}
          {isPaused && onResume && (
            <button
              onClick={onResume}
              disabled={isPending}
              className="px-3 py-1 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
            >
              Resume
            </button>
          )}
          {(isActive || isPaused) && onCancel && (
            <button
              onClick={onCancel}
              disabled={isPending}
              className="px-3 py-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
