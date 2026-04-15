import { useState } from 'react';
import { Principal } from '@dfinity/principal';
import { useServiceNotifications } from '../hooks/useServiceNotifications';
import { PrincipalDisplay } from '../components/PrincipalDisplay';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { ServiceNotificationType } from '@declarations/subs/subs.did.d.ts';
import { CONFIG } from '../config';

function isValidPrincipal(text: string): boolean {
  try { Principal.fromText(text); return true; } catch { return false; }
}

function formatDate(ns: bigint): string {
  return new Date(Number(ns / 1_000_000n)).toLocaleString();
}

type Severity = 'info' | 'warning' | 'error';

function getNotificationInfo(notification: ServiceNotificationType): { type: string; severity: Severity; details: string } {
  if ('SubscriptionActivated' in notification) {
    const d = notification.SubscriptionActivated;
    return { type: 'Activated', severity: 'info', details: `Sub #${d.subscriptionId.toString()} — ${d.reason}` };
  }
  if ('SubscriptionPaused' in notification) {
    const d = notification.SubscriptionPaused;
    return { type: 'Paused', severity: 'warning', details: `Sub #${d.subscriptionId.toString()} — ${d.reason}` };
  }
  if ('SubscriptionEnded' in notification) {
    const d = notification.SubscriptionEnded;
    return { type: 'Ended', severity: 'warning', details: `Sub #${d.subscriptionId.toString()} — ${d.reason}` };
  }
  if ('AllowanceInsufficient' in notification) {
    const d = notification.AllowanceInsufficient;
    return { type: 'Allowance Insufficient', severity: 'error', details: `Sub #${d.subscriptionId.toString()}` };
  }
  if ('LedgerError' in notification) {
    const d = notification.LedgerError;
    return { type: 'Ledger Error', severity: 'error', details: `Sub #${d.subscriptionId.toString()} — ${d.error}` };
  }
  if ('ExchangeRateError' in notification) {
    const d = notification.ExchangeRateError;
    return { type: 'Exchange Rate Error', severity: 'error', details: `Sub #${d.subscriptionId.toString()}${d.reason.length > 0 ? ` — ${d.reason[0]}` : ''}` };
  }
  return { type: 'Unknown', severity: 'info', details: '' };
}

const SEVERITY_STYLES: Record<Severity, string> = {
  info: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export function ServiceNotifications() {
  const [servicePrincipal, setServicePrincipal] = useState('');
  const [activeService, setActiveService] = useState('');
  const [prev, setPrev] = useState<bigint | undefined>();

  const { data: notifications, isPending } = useServiceNotifications(
    activeService || undefined, prev,
  );

  const handleLoad = () => {
    if (isValidPrincipal(servicePrincipal)) {
      setActiveService(servicePrincipal);
      setPrev(undefined);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-emerald-400 mb-2">Service Notifications</h2>
      <p className="text-slate-400 mb-6">
        View notifications for a service canister — payment errors, subscription changes, etc.
      </p>

      {/* Service Input */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
        <label className="block text-sm font-medium text-slate-300 mb-2">Service Canister Principal</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={servicePrincipal}
            onChange={(e) => setServicePrincipal(e.target.value)}
            placeholder="aaaaa-aa"
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
          />
          <button
            onClick={handleLoad}
            disabled={!isValidPrincipal(servicePrincipal)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Load
          </button>
        </div>
      </div>

      {/* Notifications */}
      {activeService && (
        <section>
          {isPending ? (
            <LoadingSpinner />
          ) : notifications && notifications.length > 0 ? (
            <>
              <div className="space-y-3">
                {notifications.map((notif, idx) => {
                  const info = getNotificationInfo(notif.notification);
                  return (
                    <div
                      key={`${notif.date.toString()}-${idx}`}
                      className={`rounded-lg p-4 border ${SEVERITY_STYLES[info.severity]}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{info.type}</span>
                            <span className="text-xs opacity-60">{formatDate(notif.date)}</span>
                          </div>
                          <p className="text-sm opacity-80">{info.details}</p>
                        </div>
                        <PrincipalDisplay principal={notif.principal.toText()} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => setPrev(undefined)}
                  disabled={prev === undefined}
                  className="px-3 py-1 text-sm bg-slate-800 text-slate-400 hover:text-slate-200 rounded disabled:opacity-30"
                >
                  First
                </button>
                {notifications.length === CONFIG.PAGE_SIZE && (
                  <button
                    onClick={() => setPrev(notifications[notifications.length - 1]!.date)}
                    className="px-3 py-1 text-sm bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
                  >
                    Next →
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="text-slate-500">No notifications found for this service.</p>
          )}
        </section>
      )}
    </div>
  );
}
