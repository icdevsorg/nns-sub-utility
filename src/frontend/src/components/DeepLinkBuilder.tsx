import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  buildSubscribeDeepLink,
  createDeepLinkBuilderValues,
  isCustomInterval,
  type DeepLinkBuilderValues,
} from '../utils/deepLink';
import { useTokenInfo } from '../hooks/useTokenInfo';
import {
  formatAccountText,
  isValidPrincipal,
  isValidSubaccountHex,
  parseAccountText,
} from '../utils/account';
import { sortTokenOptions } from '../utils/tokenOptions';

const INTERVAL_OPTIONS = [
  { label: 'Hourly', value: 'Hourly' },
  { label: 'Daily', value: 'Daily' },
  { label: 'Weekly', value: 'Weekly' },
  { label: 'Monthly', value: 'Monthly' },
  { label: 'Yearly', value: 'Yearly' },
  { label: 'Custom (nanoseconds)', value: 'Interval' },
  { label: 'Custom (days)', value: 'Days' },
  { label: 'Custom (weeks)', value: 'Weeks' },
  { label: 'Custom (months)', value: 'Months' },
];

interface DeepLinkBuilderProps {
  initialValues?: Partial<DeepLinkBuilderValues>;
  title?: string;
  description?: string;
  tokenOptions?: Array<{ value: string; label: string }>;
}

export function DeepLinkBuilder({
  initialValues,
  title = 'Deep Link Builder',
  description = 'Generate a pre-filled subscribe URL for your users.',
  tokenOptions,
}: DeepLinkBuilderProps) {
  const [values, setValues] = useState(() => createDeepLinkBuilderValues(initialValues));
  const { data: supportedTokens } = useTokenInfo();

  const link = useMemo(() => {
    const origin = typeof window === 'undefined' ? undefined : window.location.origin;
    return buildSubscribeDeepLink(values, { origin });
  }, [values]);

  const customInterval = isCustomInterval(values.interval);

  const resolvedTokenOptions = useMemo(() => {
    return sortTokenOptions((tokenOptions && tokenOptions.length > 0)
      ? tokenOptions
      : (supportedTokens ?? []).map((token) => ({
          value: token.tokenCanister.toText(),
          label: `${token.tokenSymbol} (${token.tokenCanister.toText()})`,
        })));
  }, [supportedTokens, tokenOptions]);

  useEffect(() => {
    if (values.token && resolvedTokenOptions.length > 0 && !resolvedTokenOptions.some((option) => option.value === values.token)) {
      setValues((current) => ({ ...current, token: '' }));
    }
  }, [resolvedTokenOptions, values.token]);

  function update<K extends keyof DeepLinkBuilderValues>(key: K, value: DeepLinkBuilderValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleReset() {
    setValues(createDeepLinkBuilderValues(initialValues));
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-slate-100">{title}</h4>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-2 text-xs bg-slate-900 border border-slate-600 rounded-lg text-slate-300 hover:border-slate-500 transition-colors"
        >
          Reset Builder
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Service Canister Principal">
          <input
            type="text"
            aria-label="Service Canister Principal"
            value={values.service}
            onChange={(e) => update('service', e.target.value)}
            placeholder="aaaaa-aa"
            className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">
            Use your service/backend canister principal here. This is the canister that will query or manage subscriptions against the ICRC-79 service, not an end-user principal.
          </p>
        </Field>

        <Field label="Token Canister Principal">
          <select
            aria-label="Token Canister Principal"
            value={values.token}
            onChange={(e) => update('token', e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Select a supported token</option>
            {resolvedTokenOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Tokens come from the subscription canister&apos;s supported-token registry. Seed this from a service subscription below when possible.
          </p>
          {resolvedTokenOptions.length === 0 && (
            <p className="mt-1 text-xs text-amber-400">No supported tokens are currently registered.</p>
          )}
        </Field>

        <Field label="Amount Per Interval">
          <input
            type="text"
            value={values.amount}
            onChange={(e) => update('amount', e.target.value)}
            placeholder="100000000"
            className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </Field>

        <Field label="Interval">
          <select
            value={values.interval}
            onChange={(e) => update('interval', e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 focus:border-emerald-500 focus:outline-none"
          >
            {INTERVAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </Field>

        {customInterval && (
          <Field label="Custom Interval Value">
            <input
              type="number"
              min="1"
              value={values.intervalValue}
              onChange={(e) => update('intervalValue', e.target.value)}
              placeholder="1"
              className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </Field>
        )}

        <Field label="Product ID">
          <input
            type="text"
            aria-label="Product ID"
            value={values.product}
            onChange={(e) => update('product', e.target.value)}
            placeholder="42"
            className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </Field>

        <Field label="End Date">
          <input
            type="date"
            value={values.endDate}
            onChange={(e) => update('endDate', e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 focus:border-emerald-500 focus:outline-none"
          />
        </Field>

        <Field label="Redirect URL">
          <input
            type="url"
            value={values.redirect}
            onChange={(e) => update('redirect', e.target.value)}
            placeholder="https://example.com/after-subscribe"
            className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </Field>

        <AccountField
          label="Target Account"
          value={values.targetAccount}
          onChange={(nextValue) => update('targetAccount', nextValue)}
        />

        <AccountField
          label="Broker Account"
          value={values.broker}
          onChange={(nextValue) => update('broker', nextValue)}
        />

        <Field label="Memo" className="md:col-span-2">
          <input
            type="text"
            value={values.memo}
            onChange={(e) => update('memo', e.target.value)}
            placeholder="Premium yearly plan"
            className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </Field>
      </div>

      <div className="mt-5 border-t border-slate-700 pt-4">
        <label htmlFor="generated-deep-link" className="block text-sm font-medium text-slate-300 mb-2">
          Generated Deep Link
        </label>
        <textarea
          id="generated-deep-link"
          aria-label="Generated deep link"
          readOnly
          rows={4}
          value={link}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-emerald-300 text-sm font-mono focus:outline-none"
        />
        <div className="mt-3 flex flex-wrap gap-3 items-center">
          <a
            href={link}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            Open Prefilled Subscribe Page
          </a>
          <p className="text-xs text-slate-500">
            Use raw token units for amount. Custom intervals add an <span className="font-mono">intervalValue</span> query param.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  children,
  label,
  className = '',
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-medium text-slate-300 ${className}`.trim()}>
      {label}
      {children}
    </label>
  );
}

function AccountField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const parsed = parseAccountText(value);
  const hasValue = value.trim().length > 0;
  const ownerValid = parsed.owner.length > 0 && isValidPrincipal(parsed.owner);
  const subaccountValid = parsed.subaccount.length === 0 || isValidSubaccountHex(parsed.subaccount);

  function handleOwnerChange(rawValue: string) {
    if (rawValue.includes(':')) {
      onChange(formatAccountText(parseAccountText(rawValue)));
      return;
    }

    onChange(formatAccountText({ owner: rawValue, subaccount: parsed.subaccount }));
  }

  function handleSubaccountChange(rawValue: string) {
    onChange(formatAccountText({ owner: parsed.owner, subaccount: rawValue }));
  }

  return (
    <Field label={label}>
      <div className="mt-1 grid gap-2">
        <input
          type="text"
          value={parsed.owner}
          onChange={(e) => handleOwnerChange(e.target.value)}
          placeholder="aaaaa-aa"
          aria-label={`${label} principal`}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono text-sm"
        />
        <input
          type="text"
          value={parsed.subaccount}
          onChange={(e) => handleSubaccountChange(e.target.value)}
          placeholder="Optional 64-char hex subaccount"
          aria-label={`${label} subaccount`}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono text-sm"
        />
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Enter an owner principal with an optional 64-character hex subaccount, or paste a full account string in the form <span className="font-mono">principal:subaccountHex</span>.
      </p>
      {hasValue && !ownerValid && (
        <p className="mt-1 text-xs text-red-400">Enter a valid owner principal.</p>
      )}
      {parsed.subaccount && !subaccountValid && (
        <p className="mt-1 text-xs text-red-400">Subaccount must be exactly 64 hex characters.</p>
      )}
    </Field>
  );
}