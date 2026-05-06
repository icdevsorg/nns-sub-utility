import type { Interval } from '@declarations/subs/subs.did.d.ts';

export interface DeepLinkBuilderValues {
  token: string;
  service: string;
  amount: string;
  interval: string;
  intervalValue: string;
  product: string;
  redirect: string;
  endDate: string;
  memo: string;
  targetAccount: string;
  broker: string;
}

export const CUSTOM_INTERVAL_TYPES = ['Interval', 'Days', 'Weeks', 'Months'] as const;

const DEFAULT_VALUES: DeepLinkBuilderValues = {
  token: '',
  service: '',
  amount: '',
  interval: 'Monthly',
  intervalValue: '',
  product: '',
  redirect: '',
  endDate: '',
  memo: '',
  targetAccount: '',
  broker: '',
};

export function createDeepLinkBuilderValues(
  initialValues?: Partial<DeepLinkBuilderValues>,
): DeepLinkBuilderValues {
  return {
    ...DEFAULT_VALUES,
    ...initialValues,
  };
}

export function isCustomInterval(interval: string): boolean {
  return CUSTOM_INTERVAL_TYPES.some((value) => value === interval);
}

export function buildSubscribeDeepLink(
  values: Partial<DeepLinkBuilderValues>,
  options?: { origin?: string },
): string {
  const params = new URLSearchParams();
  const base = options?.origin ? `${options.origin}/#/subscribe` : '/#/subscribe';

  appendParam(params, 'token', values.token);
  appendParam(params, 'service', values.service);
  appendParam(params, 'amount', values.amount);
  appendParam(params, 'interval', values.interval);

  if (values.interval && isCustomInterval(values.interval)) {
    appendParam(params, 'intervalValue', values.intervalValue);
  }

  appendParam(params, 'product', values.product);
  appendParam(params, 'redirect', values.redirect);
  appendParam(params, 'endDate', values.endDate);
  appendParam(params, 'memo', values.memo);
  appendParam(params, 'targetAccount', values.targetAccount);
  appendParam(params, 'broker', values.broker);

  const query = params.toString();
  return query.length > 0 ? `${base}?${query}` : base;
}

function appendParam(params: URLSearchParams, key: string, value: string | undefined) {
  if (!value) return;
  const trimmed = value.trim();
  if (trimmed.length > 0) {
    params.set(key, trimmed);
  }
}

export function serializeIntervalForDeepLink(
  interval: Interval,
): Pick<DeepLinkBuilderValues, 'interval' | 'intervalValue'> {
  if ('Hourly' in interval) return { interval: 'Hourly', intervalValue: '' };
  if ('Interval' in interval) return { interval: 'Interval', intervalValue: interval.Interval.toString() };
  if ('Daily' in interval) return { interval: 'Daily', intervalValue: '' };
  if ('Weekly' in interval) return { interval: 'Weekly', intervalValue: '' };
  if ('Monthly' in interval) return { interval: 'Monthly', intervalValue: '' };
  if ('Yearly' in interval) return { interval: 'Yearly', intervalValue: '' };
  if ('Days' in interval) return { interval: 'Days', intervalValue: interval.Days.toString() };
  if ('Weeks' in interval) return { interval: 'Weeks', intervalValue: interval.Weeks.toString() };
  return { interval: 'Months', intervalValue: interval.Months.toString() };
}