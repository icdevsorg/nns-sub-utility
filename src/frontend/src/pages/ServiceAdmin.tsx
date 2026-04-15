import { useState } from 'react';
import { Principal } from '@dfinity/principal';
import { useAuth } from '../auth/AuthProvider';
import { useServiceSubscriptions } from '../hooks/useServiceSubscriptions';
import { useServicePayments } from '../hooks/useServicePayments';
import { useServiceDailyRevenue } from '../hooks/useServiceDailyRevenue';
import { useConfirmSubscription } from '../hooks/useConfirmSubscription';
import { DfxCommandBuilder } from '../components/DfxCommandBuilder';
import { RevenueChart } from '../components/RevenueChart';
import { PrincipalDisplay } from '../components/PrincipalDisplay';
import { StatusBadge } from '../components/StatusBadge';
import { IntervalLabel } from '../components/IntervalLabel';
import { PaymentTable } from '../components/PaymentTable';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { SubStatusFilter } from '@declarations/subs/subs.did.d.ts';
import { CONFIG } from '../config';

function isValidPrincipal(text: string): boolean {
  try { Principal.fromText(text); return true; } catch { return false; }
}

function formatAmount(n: bigint, decimals = 8): string {
  return (Number(n) / Math.pow(10, decimals)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

type StatusTab = 'All' | 'Active' | 'Paused' | 'WillCancel' | 'Canceled';

const STATUS_MAP: Record<StatusTab, SubStatusFilter | undefined> = {
  All: undefined,
  Active: { Active: null },
  Paused: { Paused: null },
  WillCancel: { WillCancel: null },
  Canceled: { Canceled: null },
};

export function ServiceAdmin() {
  const { isAuthenticated, principal: userPrincipal } = useAuth();
  const [servicePrincipal, setServicePrincipal] = useState('');
  const [activeService, setActiveService] = useState('');
  const [statusTab, setStatusTab] = useState<StatusTab>('All');
  const [subPrev, setSubPrev] = useState<bigint | undefined>();
  const [payPrev, setPayPrev] = useState<bigint | undefined>();
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'payments' | 'revenue' | 'dfx'>('subscriptions');

  const statusFilter = STATUS_MAP[statusTab];
  const filter = statusFilter ? { status: [statusFilter] as [SubStatusFilter], subscriptions: [] as [], products: [] as [] } : undefined;

  const { data: subscriptions, isPending: subsLoading } = useServiceSubscriptions(
    activeService || undefined, filter, subPrev,
  );
  const { data: payments, isPending: paysLoading } = useServicePayments(
    activeService || undefined, undefined, payPrev,
  );

  // Revenue: last 30 days
  const now = BigInt(Math.floor(Date.now() / 86_400_000));
  const thirtyDaysAgo = now - 30n;
  const { data: revenueData, isPending: revenueLoading } = useServiceDailyRevenue(
    activeService || undefined, undefined, thirtyDaysAgo, now,
  );

  const confirmMutation = useConfirmSubscription();

  const handleLoadService = () => {
    if (isValidPrincipal(servicePrincipal)) {
      setActiveService(servicePrincipal);
      setSubPrev(undefined);
      setPayPrev(undefined);
    }
  };

  const handleConfirm = async (subscriptionId: bigint) => {
    try {
      await confirmMutation.mutateAsync([{ subscriptionId, checkRate: [] }]);
    } catch {
      // Error handled by mutation state
    }
  };

  const handleUseMyPrincipal = () => {
    if (userPrincipal) {
      setServicePrincipal(userPrincipal);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-emerald-400 mb-2">Service Admin</h2>
      <p className="text-slate-400 mb-6">
        View and manage subscriptions for a service canister.
      </p>

      {/* Service Principal Input */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
        <label className="block text-sm font-medium text-slate-300 mb-2">Service Canister Principal</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={servicePrincipal}
            onChange={(e) => setServicePrincipal(e.target.value)}
            placeholder="aaaaa-aa"
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleLoadService()}
          />
          <button
            onClick={handleLoadService}
            disabled={!isValidPrincipal(servicePrincipal)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Load
          </button>
        </div>
        {isAuthenticated && userPrincipal && (
          <button
            onClick={handleUseMyPrincipal}
            className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Use my principal ({userPrincipal.slice(0, 8)}...)
          </button>
        )}
        {servicePrincipal && !isValidPrincipal(servicePrincipal) && (
          <p className="mt-1 text-xs text-red-400">Invalid principal</p>
        )}
      </div>

      {/* Content — only shown after service is loaded */}
      {activeService && (
        <>
          {/* Tab Nav */}
          <div className="flex gap-1 mb-6 bg-slate-800 rounded-lg p-1 w-fit">
            {(['subscriptions', 'payments', 'revenue', 'dfx'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  activeTab === tab
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'subscriptions' ? 'Subscriptions' : tab === 'payments' ? 'Payments' : tab === 'revenue' ? 'Revenue' : 'DFX Commands'}
              </button>
            ))}
          </div>

          {/* Subscriptions Tab */}
          {activeTab === 'subscriptions' && (
            <section>
              {/* Status Filter */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {(Object.keys(STATUS_MAP) as StatusTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setStatusTab(tab); setSubPrev(undefined); }}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      statusTab === tab
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {subsLoading ? (
                <LoadingSpinner />
              ) : subscriptions && subscriptions.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-400 text-sm">
                          <th className="py-2 px-3">ID</th>
                          <th className="py-2 px-3">Subscriber</th>
                          <th className="py-2 px-3">Token</th>
                          <th className="py-2 px-3 text-right">Amount</th>
                          <th className="py-2 px-3">Interval</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Product</th>
                          {isAuthenticated && <th className="py-2 px-3">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {subscriptions.map((sub) => (
                          <tr key={sub.subscriptionId.toString()} className="border-b border-slate-800 text-sm">
                            <td className="py-2 px-3 text-emerald-400 font-mono">
                              <a href={`/#/subscriptions/${sub.subscriptionId.toString()}`} className="hover:underline">
                                #{sub.subscriptionId.toString()}
                              </a>
                            </td>
                            <td className="py-2 px-3"><PrincipalDisplay principal={sub.account.owner.toText()} /></td>
                            <td className="py-2 px-3"><PrincipalDisplay principal={sub.tokenCanister.toText()} /></td>
                            <td className="py-2 px-3 text-right font-mono text-slate-300">{formatAmount(sub.amountPerInterval)}</td>
                            <td className="py-2 px-3"><IntervalLabel interval={sub.interval} /></td>
                            <td className="py-2 px-3"><StatusBadge status={sub.status} /></td>
                            <td className="py-2 px-3 text-slate-400">{sub.productId.length > 0 ? sub.productId[0]!.toString() : '—'}</td>
                            {isAuthenticated && (
                              <td className="py-2 px-3">
                                <button
                                  onClick={() => handleConfirm(sub.subscriptionId)}
                                  disabled={confirmMutation.isPending}
                                  className="text-xs px-2 py-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded transition-colors disabled:opacity-50"
                                >
                                  Confirm
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={() => setSubPrev(undefined)}
                      disabled={subPrev === undefined}
                      className="px-3 py-1 text-sm bg-slate-800 text-slate-400 hover:text-slate-200 rounded disabled:opacity-30"
                    >
                      First
                    </button>
                    {subscriptions.length === CONFIG.PAGE_SIZE && (
                      <button
                        onClick={() => setSubPrev(subscriptions[subscriptions.length - 1]!.subscriptionId)}
                        className="px-3 py-1 text-sm bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
                      >
                        Next →
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-slate-500">No subscriptions found for this service.</p>
              )}
            </section>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <section>
              {paysLoading ? (
                <LoadingSpinner />
              ) : payments && payments.length > 0 ? (
                <>
                  <PaymentTable payments={payments} />
                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={() => setPayPrev(undefined)}
                      disabled={payPrev === undefined}
                      className="px-3 py-1 text-sm bg-slate-800 text-slate-400 hover:text-slate-200 rounded disabled:opacity-30"
                    >
                      First
                    </button>
                    {payments.length === CONFIG.PAGE_SIZE && (
                      <button
                        onClick={() => setPayPrev(payments[payments.length - 1]!.paymentId)}
                        className="px-3 py-1 text-sm bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
                      >
                        Next →
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-slate-500">No payments found for this service.</p>
              )}
            </section>
          )}

          {/* Revenue Tab */}
          {activeTab === 'revenue' && (
            <section>
              <h3 className="text-lg font-semibold text-slate-200 mb-4">Daily Revenue (Last 30 Days)</h3>
              {revenueLoading ? (
                <LoadingSpinner />
              ) : revenueData ? (
                <RevenueChart data={revenueData} />
              ) : (
                <p className="text-slate-500">No revenue data available.</p>
              )}
            </section>
          )}

          {/* DFX Tab */}
          {activeTab === 'dfx' && (
            <DfxCommandBuilder servicePrincipal={activeService} />
          )}
        </>
      )}
    </div>
  );
}
