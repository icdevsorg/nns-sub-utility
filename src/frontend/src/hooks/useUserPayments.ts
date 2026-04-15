import { useQuery } from '@tanstack/react-query';
import { getAuthenticatedSubsActor, getPlugSubsActor, type PaymentRecord } from '../canister/subs';
import type { Identity } from '@dfinity/agent';
import { CONFIG } from '../config';
import type { AuthMethod } from '../auth/AuthProvider';

interface UseUserPaymentsOpts {
  identity: Identity | null;
  authMethod: AuthMethod;
  prev?: bigint;
  take?: bigint;
}

export function useUserPayments({ identity, authMethod, prev, take }: UseUserPaymentsOpts) {
  const key = identity ? identity.getPrincipal().toText() : authMethod === 'plug' ? 'plug' : 'none';
  return useQuery({
    queryKey: ['userPayments', key, prev?.toString()],
    queryFn: async (): Promise<PaymentRecord[]> => {
      const actor = authMethod === 'plug'
        ? await getPlugSubsActor()
        : await getAuthenticatedSubsActor(identity!);
      return actor.icrc79_get_user_payments(
        [],
        prev !== undefined ? [prev] : [],
        take !== undefined ? [take] : [BigInt(CONFIG.PAGE_SIZE)],
      );
    },
    enabled: !!identity || authMethod === 'plug',
    staleTime: CONFIG.STALE_TIME,
    refetchInterval: CONFIG.REFETCH_INTERVAL,
  });
}
