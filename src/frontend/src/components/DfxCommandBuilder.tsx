import { useState, useMemo } from 'react';

type Operation = 'get_service_subscriptions' | 'get_service_payments' | 'get_service_notifications' | 'confirm_subscription' | 'pause_subscription' | 'cancel_subscription';

const OPERATIONS: { value: Operation; label: string; description: string }[] = [
  { value: 'get_service_subscriptions', label: 'Get Service Subscriptions', description: 'Query all subscriptions for a service canister' },
  { value: 'get_service_payments', label: 'Get Service Payments', description: 'Query payment records for a service' },
  { value: 'get_service_notifications', label: 'Get Service Notifications', description: 'Query notifications for a service' },
  { value: 'confirm_subscription', label: 'Confirm Subscription', description: 'Confirm a pending subscription' },
  { value: 'pause_subscription', label: 'Pause/Resume Subscription', description: 'Pause or resume a subscription' },
  { value: 'cancel_subscription', label: 'Cancel Subscription', description: 'Cancel a subscription' },
];

const CANISTER_ID = 'hl3xq-uiaaa-aaaar-qbxqa-cai';

interface DfxCommandBuilderProps {
  servicePrincipal: string;
}

export function DfxCommandBuilder({ servicePrincipal }: DfxCommandBuilderProps) {
  const [operation, setOperation] = useState<Operation>('get_service_subscriptions');
  const [subscriptionId, setSubscriptionId] = useState('');
  const [reason, setReason] = useState('');
  const [active, setActive] = useState(true);
  const [copied, setCopied] = useState(false);

  const command = useMemo(() => {
    switch (operation) {
      case 'get_service_subscriptions':
        return `dfx canister call ${CANISTER_ID} icrc79_get_service_subscriptions '(principal "${servicePrincipal}", opt record { status = null; subscriptions = null; products = null }, null, opt 20)'`;

      case 'get_service_payments':
        return `dfx canister call ${CANISTER_ID} icrc79_get_service_payments '(principal "${servicePrincipal}", opt record { status = null; subscriptions = null; products = null }, null, opt 20)'`;

      case 'get_service_notifications':
        return `dfx canister call ${CANISTER_ID} icrc79_get_service_notifications '(principal "${servicePrincipal}", null, opt 20)'`;

      case 'confirm_subscription':
        return subscriptionId
          ? `dfx canister call ${CANISTER_ID} icrc79_confirm_subscription '(vec { record { subscriptionId = ${subscriptionId} : nat; checkRate = null } })'`
          : `dfx canister call ${CANISTER_ID} icrc79_confirm_subscription '(vec { record { subscriptionId = <ID> : nat; checkRate = null } })'`;

      case 'pause_subscription':
        return subscriptionId
          ? `dfx canister call ${CANISTER_ID} icrc79_pause_subscription '(vec { record { subscriptionId = ${subscriptionId} : nat; active = ${active}; reason = "${reason || 'Paused via CLI'}" } })'`
          : `dfx canister call ${CANISTER_ID} icrc79_pause_subscription '(vec { record { subscriptionId = <ID> : nat; active = ${active}; reason = "${reason || 'Paused via CLI'}" } })'`;

      case 'cancel_subscription':
        return subscriptionId
          ? `dfx canister call ${CANISTER_ID} icrc79_cancel_subscription '(vec { record { subscriptionId = ${subscriptionId} : nat; reason = "${reason || 'Cancelled via CLI'}" } })'`
          : `dfx canister call ${CANISTER_ID} icrc79_cancel_subscription '(vec { record { subscriptionId = <ID> : nat; reason = "${reason || 'Cancelled via CLI'}" } })'`;
    }
  }, [operation, servicePrincipal, subscriptionId, reason, active]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const needsSubId = ['confirm_subscription', 'pause_subscription', 'cancel_subscription'].includes(operation);
  const needsReason = ['pause_subscription', 'cancel_subscription'].includes(operation);
  const needsActive = operation === 'pause_subscription';

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-slate-200 mb-4">DFX Command Builder</h3>

      {/* Operation Select */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-1">Operation</label>
        <select
          value={operation}
          onChange={(e) => setOperation(e.target.value as Operation)}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 focus:border-emerald-500 focus:outline-none"
        >
          {OPERATIONS.map((op) => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">
          {OPERATIONS.find((o) => o.value === operation)?.description}
        </p>
      </div>

      {/* Subscription ID (for mutations) */}
      {needsSubId && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-1">Subscription ID</label>
          <input
            type="text"
            value={subscriptionId}
            onChange={(e) => setSubscriptionId(e.target.value)}
            placeholder="e.g. 42"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      )}

      {/* Active toggle (for pause) */}
      {needsActive && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-1">Action</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="radio"
                checked={!active}
                onChange={() => setActive(false)}
                className="accent-emerald-500"
              />
              Pause
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="radio"
                checked={active}
                onChange={() => setActive(true)}
                className="accent-emerald-500"
              />
              Resume
            </label>
          </div>
        </div>
      )}

      {/* Reason (for pause/cancel) */}
      {needsReason && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-1">Reason</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional reason"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      )}

      {/* Generated Command */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-300 mb-1">Generated Command</label>
        <div className="relative">
          <pre className="bg-slate-950 rounded-lg p-4 text-sm text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap break-all border border-slate-700">
            {command}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Run this with <code className="text-slate-400">--network ic</code> to target mainnet.
        </p>
      </div>
    </div>
  );
}
