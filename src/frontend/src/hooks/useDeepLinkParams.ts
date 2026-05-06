import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface DeepLinkParams {
  token?: string;
  service?: string;
  amount?: string;
  interval?: string;
  intervalValue?: string;
  product?: string;
  redirect?: string;
  endDate?: string;
  memo?: string;
  targetAccount?: string;
  broker?: string;
}

/**
 * Parse URL query params from a subscribe deep link.
 * Example: /#/subscribe?token=<principal>&service=<principal>&amount=100000000&interval=Monthly
 */
export function useDeepLinkParams(): DeepLinkParams {
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    const params: DeepLinkParams = {};
    const token = searchParams.get('token');
    const service = searchParams.get('service');
    const amount = searchParams.get('amount');
    const interval = searchParams.get('interval');
    const intervalValue = searchParams.get('intervalValue');
    const product = searchParams.get('product');
    const redirect = searchParams.get('redirect');
    const endDate = searchParams.get('endDate');
    const memo = searchParams.get('memo');
    const targetAccount = searchParams.get('targetAccount');
    const broker = searchParams.get('broker');

    if (token) params.token = token;
    if (service) params.service = service;
    if (amount) params.amount = amount;
    if (interval) params.interval = interval;
    if (intervalValue) params.intervalValue = intervalValue;
    if (product) params.product = product;
    if (redirect) params.redirect = redirect;
    if (endDate) params.endDate = endDate;
    if (memo) params.memo = memo;
    if (targetAccount) params.targetAccount = targetAccount;
    if (broker) params.broker = broker;

    return params;
  }, [searchParams]);
}
