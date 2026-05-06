import { useQuery } from '@tanstack/react-query';
import { getAuthenticatedSubsActor, getPlugSubsActor, type Subscription } from '../canister/subs';
import type { Identity } from '@dfinity/agent';
import type { SubStatusFilter, UserSubscriptionsFilter } from '@declarations/subs/subs.did.d.ts';
import { CONFIG } from '../config';
import type { AuthMethod } from '../auth/AuthProvider';

interface UseUserSubscriptionsOpts {
  identity: Identity | null;
  authMethod: AuthMethod;
  statusFilter?: SubStatusFilter;
  subscriptionIds?: bigint[];
  prev?: bigint;
  take?: bigint;
}

export function useUserSubscriptions({ identity, authMethod, statusFilter, subscriptionIds, prev, take }: UseUserSubscriptionsOpts) {
  const key = identity ? identity.getPrincipal().toText() : authMethod === 'plug' ? 'plug' : 'none';
  return useQuery({
    queryKey: ['userSubscriptions', key, statusFilter, subscriptionIds?.map((id) => id.toString()).join(','), prev?.toString()],
    queryFn: async (): Promise<Subscription[]> => {
      const actor = authMethod === 'plug'
        ? await getPlugSubsActor()
        : await getAuthenticatedSubsActor(identity!);
      const subscriptionsFilter: [] | [bigint[]] = subscriptionIds && subscriptionIds.length > 0 ? [subscriptionIds] : [];
      const f: [] | [UserSubscriptionsFilter] = statusFilter
        ? [{ status: [statusFilter], subscriptions: subscriptionsFilter, services: [], products: [], subaccounts: [] }]
        : subscriptionIds && subscriptionIds.length > 0
          ? [{ status: [], subscriptions: [subscriptionIds], services: [], products: [], subaccounts: [] }]
          : [];
      return actor.icrc79_get_user_subscriptions(
        f,
        prev !== undefined ? [prev] : [],
        take !== undefined ? [take] : [BigInt(CONFIG.PAGE_SIZE)],
      );
    },
    enabled: !!identity || authMethod === 'plug',
    staleTime: CONFIG.STALE_TIME,
    refetchInterval: CONFIG.REFETCH_INTERVAL,
  });
}
