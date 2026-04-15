import { useState, useCallback, useEffect } from 'react';
import { Principal } from '@dfinity/principal';
import type { SubscriptionRequestItem, Interval } from '@declarations/subs/subs.did.d.ts';
import { useAuth } from '../auth/AuthProvider';
import { useTokenMetadata, type TokenMetadata } from '../hooks/useTokenMetadata';
import { useAllowance } from '../hooks/useAllowance';
import { useApproveToken } from '../hooks/useApproveToken';
import { useSubscribe } from '../hooks/useSubscribe';
import { TokenDisplay } from './TokenDisplay';
import { LoadingSpinner } from './LoadingSpinner';
import { getTokenActor } from '../canister/icrc2';
import type { DeepLinkParams } from '../hooks/useDeepLinkParams';

function useTokenBalance(canisterId: string | undefined, principalText: string | null) {
  const [balance, setBalance] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!canisterId || !principalText) { setBalance(null); return; }
    let cancelled = false;
    setLoading(true);
    const fetchBalance = async () => {
      try {
        const actor = await getTokenActor(canisterId);
        const bal = await actor.icrc1_balance_of({
          owner: Principal.fromText(principalText),
          subaccount: [],
        });
        if (!cancelled) setBalance(bal);
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    };
    fetchBalance();
    const id = setInterval(fetchBalance, 15_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [canisterId, principalText]);

  return { balance, loading };
}

function formatTokenBalance(raw: bigint, decimals: number): string {
  const divisor = BigInt(Math.pow(10, decimals));
  const whole = raw / divisor;
  const frac = raw % divisor;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${whole}.${fracStr}`;
}

type Step = 'form' | 'approve' | 'subscribing' | 'success' | 'error';

const INTERVAL_OPTIONS: { label: string; value: string }[] = [
  { label: 'Hourly', value: 'Hourly' },
  { label: 'Daily', value: 'Daily' },
  { label: 'Weekly', value: 'Weekly' },
  { label: 'Monthly', value: 'Monthly' },
  { label: 'Yearly', value: 'Yearly' },
  { label: 'Custom (days)', value: 'Days' },
  { label: 'Custom (weeks)', value: 'Weeks' },
  { label: 'Custom (months)', value: 'Months' },
];

function parseInterval(type: string, customValue: string): Interval | null {
  switch (type) {
    case 'Hourly': return { Hourly: null };
    case 'Daily': return { Daily: null };
    case 'Weekly': return { Weekly: null };
    case 'Monthly': return { Monthly: null };
    case 'Yearly': return { Yearly: null };
    case 'Days': {
      const n = BigInt(customValue || '0');
      return n > 0n ? { Days: n } : null;
    }
    case 'Weeks': {
      const n = BigInt(customValue || '0');
      return n > 0n ? { Weeks: n } : null;
    }
    case 'Months': {
      const n = BigInt(customValue || '0');
      return n > 0n ? { Months: n } : null;
    }
    default: return null;
  }
}

function isValidPrincipal(text: string): boolean {
  try {
    Principal.fromText(text);
    return true;
  } catch {
    return false;
  }
}

interface SubscribeFormProps {
  defaults: DeepLinkParams;
}

export function SubscribeForm({ defaults }: SubscribeFormProps) {
  const { principal } = useAuth();
  const approveMutation = useApproveToken();
  const subscribeMutation = useSubscribe();

  // Form state
  const [tokenCanister, setTokenCanister] = useState(defaults.token ?? '');
  const [serviceCanister, setServiceCanister] = useState(defaults.service ?? '');
  const [amount, setAmount] = useState(defaults.amount ?? '');
  const [intervalType, setIntervalType] = useState(defaults.interval ?? 'Monthly');
  const [customIntervalValue, setCustomIntervalValue] = useState('');
  const [productId, setProductId] = useState(defaults.product ?? '');
  const [endDate, setEndDate] = useState(defaults.endDate ?? '');
  const [memo, setMemo] = useState(defaults.memo ?? '');
  const [targetAccount, setTargetAccount] = useState(defaults.targetAccount ?? '');
  const [broker, setBroker] = useState(defaults.broker ?? '');

  const [step, setStep] = useState<Step>('form');
  const [errorMsg, setErrorMsg] = useState('');
  const [subscriptionId, setSubscriptionId] = useState<bigint | null>(null);
  const [transactionId, setTransactionId] = useState<bigint | null>(null);
  const [tokenMetadataCache, setTokenMetadataCache] = useState<Record<string, TokenMetadata>>({});

  const validTokenCanister = tokenCanister && isValidPrincipal(tokenCanister) ? tokenCanister : undefined;
  const cachedTokenMeta = validTokenCanister ? tokenMetadataCache[validTokenCanister] : undefined;

  // Token metadata
  const { data: fetchedTokenMeta } = useTokenMetadata(validTokenCanister, {
    enabled: !!validTokenCanister && !cachedTokenMeta,
    initialData: cachedTokenMeta ?? null,
  });
  const tokenMeta = fetchedTokenMeta ?? cachedTokenMeta ?? null;
  const decimals = tokenMeta?.decimals ?? 8;

  useEffect(() => {
    if (!validTokenCanister || !fetchedTokenMeta) {
      return;
    }

    setTokenMetadataCache((current) => {
      if (current[validTokenCanister] === fetchedTokenMeta) {
        return current;
      }
      return {
        ...current,
        [validTokenCanister]: fetchedTokenMeta,
      };
    });
  }, [validTokenCanister, fetchedTokenMeta]);

  // Token balance (anonymous)
  const tokenBalance = useTokenBalance(validTokenCanister, principal);

  // Allowance check
  const { data: allowanceData, refetch: refetchAllowance } = useAllowance(
    validTokenCanister,
    principal,
  );

  // Amount in raw units
  const rawAmount = (() => {
    try {
      const parsed = parseFloat(amount);
      if (isNaN(parsed) || parsed <= 0) return 0n;
      return BigInt(Math.round(parsed * Math.pow(10, decimals)));
    } catch {
      return 0n;
    }
  })();

  // How much allowance we need — a generous margin for fees + multiple payments
  // We request approval for 100x the payment amount (or at least the single payment amount)
  const requiredAllowance = rawAmount * 100n;
  const currentAllowance = allowanceData?.allowance ?? 0n;
  const needsApproval = currentAllowance < rawAmount;

  // Validation
  const isFormValid =
    tokenCanister && isValidPrincipal(tokenCanister) &&
    serviceCanister && isValidPrincipal(serviceCanister) &&
    rawAmount > 0n &&
    parseInterval(intervalType, customIntervalValue) !== null;

  const isCustomInterval = ['Days', 'Weeks', 'Months'].includes(intervalType);

  // Step handlers
  const handleApprove = useCallback(async () => {
    setStep('approve');
    setErrorMsg('');
    try {
      const result = await approveMutation.mutateAsync({
        tokenCanisterId: tokenCanister,
        amount: requiredAllowance,
      });
      if ('Err' in result) {
        const errKey = Object.keys(result.Err)[0];
        setErrorMsg(`Approval failed: ${errKey}`);
        setStep('error');
        return;
      }
      // Refetch allowance after approval
      await refetchAllowance();
      // Proceed to subscribe
      await handleSubscribe();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Approval failed');
      setStep('error');
    }
  }, [tokenCanister, requiredAllowance, approveMutation, refetchAllowance]);

  const handleSubscribe = useCallback(async () => {
    setStep('subscribing');
    setErrorMsg('');
    try {
      const interval = parseInterval(intervalType, customIntervalValue);
      if (!interval) throw new Error('Invalid interval');

      const items: SubscriptionRequestItem[] = [
        { tokenCanister: Principal.fromText(tokenCanister) },
        { serviceCanister: Principal.fromText(serviceCanister) },
        { amountPerInterval: rawAmount },
        { interval },
      ];

      if (productId) {
        items.push({ productId: BigInt(productId) });
      }
      if (endDate) {
        // Convert ISO date to nanoseconds
        const ts = new Date(endDate).getTime();
        if (!isNaN(ts)) {
          items.push({ endDate: BigInt(ts) * 1_000_000n });
        }
      }
      if (memo) {
        items.push({ memo: new TextEncoder().encode(memo) });
      }
      if (targetAccount && isValidPrincipal(targetAccount)) {
        items.push({ targetAccount: { owner: Principal.fromText(targetAccount), subaccount: [] } });
      }
      if (broker && isValidPrincipal(broker)) {
        items.push({ broker: { owner: Principal.fromText(broker), subaccount: [] } });
      }

      const result = await subscribeMutation.mutateAsync(items);

      // result is SubscriptionResult = Array<SubscriptionResultItem>
      // SubscriptionResultItem = [] | [{ Ok: ... } | { Err: ... }]
      const first = result[0];
      if (!first || first.length === 0) {
        setErrorMsg('No response from canister');
        setStep('error');
        return;
      }
      const inner = first[0];
      if (!inner || 'Err' in inner) {
        const errKey = inner ? Object.keys(inner.Err)[0] : 'Unknown error';
        setErrorMsg(`Subscription failed: ${errKey}`);
        setStep('error');
        return;
      }
      setSubscriptionId(inner.Ok.subscriptionId);
      setTransactionId(inner.Ok.transactionId);
      setStep('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Subscription failed');
      setStep('error');
    }
  }, [
    intervalType, customIntervalValue, tokenCanister, serviceCanister,
    rawAmount, productId, endDate, memo, targetAccount, broker,
    subscribeMutation,
  ]);

  const handleSubmit = useCallback(async () => {
    if (needsApproval) {
      await handleApprove();
    } else {
      await handleSubscribe();
    }
  }, [needsApproval, handleApprove, handleSubscribe]);

  const handleReset = () => {
    setStep('form');
    setErrorMsg('');
    setSubscriptionId(null);
    setTransactionId(null);
  };

  /* ── Success view ────────────────────────────── */
  if (step === 'success') {
    return (
      <div className="bg-slate-800 rounded-xl p-8 border border-emerald-500/30 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h3 className="text-2xl font-bold text-emerald-400 mb-4">Subscription Created!</h3>
        <div className="space-y-2 text-slate-300 mb-6">
          <p>Subscription ID: <span className="font-mono text-emerald-400">{subscriptionId?.toString()}</span></p>
          <p>Transaction ID: <span className="font-mono text-slate-400">{transactionId?.toString()}</span></p>
        </div>
        <div className="flex gap-4 justify-center">
          <a
            href={`/#/subscriptions/${subscriptionId?.toString()}`}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            View Subscription
          </a>
          {defaults.redirect && (
            <a
              href={`${defaults.redirect}${defaults.redirect.includes('?') ? '&' : '?'}subscriptionId=${subscriptionId?.toString()}&status=ok`}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
              rel="noopener noreferrer"
            >
              Return to Service
            </a>
          )}
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
          >
            New Subscription
          </button>
        </div>
      </div>
    );
  }

  /* ── Loading / in-progress views ─────────────── */
  if (step === 'approve') {
    return (
      <div className="bg-slate-800 rounded-xl p-8 text-center">
        <LoadingSpinner />
        <p className="text-slate-300 mt-4">Approving token allowance...</p>
        <p className="text-slate-500 text-sm mt-1">Please confirm the transaction in your wallet.</p>
      </div>
    );
  }

  if (step === 'subscribing') {
    return (
      <div className="bg-slate-800 rounded-xl p-8 text-center">
        <LoadingSpinner />
        <p className="text-slate-300 mt-4">Creating subscription...</p>
      </div>
    );
  }

  /* ── Error view ──────────────────────────────── */
  if (step === 'error') {
    return (
      <div className="bg-slate-800 rounded-xl p-8 text-center">
        <div className="text-5xl mb-4">✗</div>
        <h3 className="text-2xl font-bold text-red-400 mb-4">Error</h3>
        <p className="text-slate-300 mb-6">{errorMsg}</p>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  /* ── Form view ───────────────────────────────── */
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      {principal && (
        <div className="mb-6 bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Your Account</h4>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Principal</p>
              <button
                onClick={() => navigator.clipboard.writeText(principal)}
                title="Click to copy"
                className="font-mono text-xs text-emerald-400 hover:text-emerald-300 transition-colors break-all text-left"
              >
                {principal}
              </button>
            </div>
            {validTokenCanister && (
              <div>
                <p className="text-xs text-slate-500 mb-0.5">
                  {tokenMeta ? `${tokenMeta.symbol} Balance` : 'Token Balance'}
                </p>
                {tokenBalance.loading && tokenBalance.balance === null ? (
                  <div className="h-5 w-24 bg-slate-700 rounded animate-pulse" />
                ) : tokenBalance.balance !== null ? (
                  <p className="text-lg font-bold text-emerald-400">
                    {formatTokenBalance(tokenBalance.balance, decimals)}
                    {tokenMeta && <span className="text-sm text-slate-400 ml-1">{tokenMeta.symbol}</span>}
                  </p>
                ) : null}
                {tokenBalance.balance !== null && tokenBalance.balance === 0n && (
                  <div className="mt-2 rounded-lg bg-amber-900/30 border border-amber-700/40 px-3 py-2 text-xs text-amber-300">
                    <p className="font-medium mb-1">You have no tokens to subscribe with.</p>
                    <p>Send <span className="font-mono">{tokenMeta?.symbol ?? 'tokens'}</span> to your principal:</p>
                    <button
                      onClick={() => navigator.clipboard.writeText(principal)}
                      className="mt-1 block w-full text-left font-mono text-amber-200 hover:text-amber-100 bg-amber-900/30 rounded px-2 py-1 break-all"
                    >
                      {principal}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="space-y-5">
        {/* Token Canister */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Token Canister *</label>
          <input
            type="text"
            value={tokenCanister}
            onChange={(e) => setTokenCanister(e.target.value)}
            placeholder="ryjl3-tyaaa-aaaaa-aaaba-cai"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono text-sm"
          />
          {validTokenCanister && (
            <div className="mt-1 text-sm">
              <TokenDisplay canisterId={validTokenCanister} metadata={tokenMeta} />
            </div>
          )}
          {tokenCanister && !isValidPrincipal(tokenCanister) && (
            <p className="mt-1 text-xs text-red-400">Invalid principal</p>
          )}
        </div>

        {/* Service Canister */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Service Canister *</label>
          <input
            type="text"
            value={serviceCanister}
            onChange={(e) => setServiceCanister(e.target.value)}
            placeholder="aaaaa-aa"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono text-sm"
          />
          {serviceCanister && !isValidPrincipal(serviceCanister) && (
            <p className="mt-1 text-xs text-red-400">Invalid principal</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Amount Per Interval * {tokenMeta && <span className="text-slate-500">({tokenMeta.symbol}, {decimals} decimals)</span>}
          </label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1.00"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          {rawAmount > 0n && (
            <p className="mt-1 text-xs text-slate-500">Raw: {rawAmount.toString()} e{decimals}</p>
          )}
        </div>

        {/* Interval */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Interval *</label>
          <select
            value={intervalType}
            onChange={(e) => setIntervalType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 focus:border-emerald-500 focus:outline-none"
          >
            {INTERVAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {isCustomInterval && (
            <input
              type="number"
              min="1"
              value={customIntervalValue}
              onChange={(e) => setCustomIntervalValue(e.target.value)}
              placeholder={`Number of ${intervalType.toLowerCase()}`}
              className="w-full mt-2 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          )}
        </div>

        {/* Product ID */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Product ID <span className="text-slate-500">(optional)</span></label>
          <input
            type="text"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">End Date <span className="text-slate-500">(optional)</span></label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Memo */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Memo <span className="text-slate-500">(optional)</span></label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Payment for..."
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Target Account */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Target Account <span className="text-slate-500">(optional, defaults to service)</span></label>
          <input
            type="text"
            value={targetAccount}
            onChange={(e) => setTargetAccount(e.target.value)}
            placeholder="Principal"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono text-sm"
          />
        </div>

        {/* Broker */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Broker <span className="text-slate-500">(optional)</span></label>
          <input
            type="text"
            value={broker}
            onChange={(e) => setBroker(e.target.value)}
            placeholder="Principal"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono text-sm"
          />
        </div>

        {/* Allowance Info */}
        {tokenCanister && isValidPrincipal(tokenCanister) && principal && rawAmount > 0n && (
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
            <h4 className="text-sm font-medium text-slate-300 mb-2">ICRC-2 Allowance</h4>
            <div className="text-sm space-y-1">
              <p className="text-slate-400">
                Current: <span className="text-slate-200 font-mono">{(Number(currentAllowance) / Math.pow(10, decimals)).toFixed(decimals)}</span>
                {tokenMeta && <span className="text-slate-500"> {tokenMeta.symbol}</span>}
              </p>
              <p className="text-slate-400">
                Required: <span className="text-slate-200 font-mono">{(Number(rawAmount) / Math.pow(10, decimals)).toFixed(decimals)}</span>
                {tokenMeta && <span className="text-slate-500"> {tokenMeta.symbol}</span>}
              </p>
              {needsApproval ? (
                <p className="text-amber-400 text-xs mt-1">
                  Insufficient allowance — an approval transaction will be submitted first.
                </p>
              ) : (
                <p className="text-emerald-400 text-xs mt-1">
                  Allowance sufficient — no approval needed.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          disabled={!isFormValid}
          onClick={handleSubmit}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {needsApproval ? 'Approve & Subscribe' : 'Subscribe'}
        </button>
      </div>
    </div>
  );
}
