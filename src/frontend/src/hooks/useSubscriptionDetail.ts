import { useQuery } from '@tanstack/react-query';
import { getAuthenticatedSubsActor, getPlugSubsActor, type Subscription, type PendingPayment } from '../canister/subs';
import type { Identity } from '@dfinity/agent';
import { CONFIG } from '../config';
import type { AuthMethod } from '../auth/AuthProvider';

interface UseSubscriptionDetailOpts {
  identity: Identity | null;
  authMethod: AuthMethod;
  subscriptionId: bigint;
}

export function useSubscriptionDetail({ identity, authMethod, subscriptionId }: UseSubscriptionDetailOpts) {
  const key = identity ? identity.getPrincipal().toText() : authMethod === 'plug' ? 'plug' : 'none';
  return useQuery({
    queryKey: ['subscriptionDetail', key, subscriptionId.toString()],
    queryFn: async (): Promise<{ subscription: Subscription | null; pending: PendingPayment | null }> => {
      const actor = authMethod === 'plug'
        ? await getPlugSubsActor()
        : await getAuthenticatedSubsActor(identity!);
      // Fetch user's subscriptions filtered to just this one
      const subs = await actor.icrc79_get_user_subscriptions(
        [],
        [],
        [100n],
      );
      const sub = subs.find((s) => s.subscriptionId === subscriptionId) ?? null;

      // Fetch pending payment
      const pending = await actor.icrc79_get_payments_pending([subscriptionId]);
      const pendingPayment = pending[0] && pending[0].length > 0 ? pending[0][0] ?? null : null;

      return { subscription: sub, pending: pendingPayment };
    },
    enabled: !!identity || authMethod === 'plug',
    staleTime: CONFIG.STALE_TIME,
  });
}
