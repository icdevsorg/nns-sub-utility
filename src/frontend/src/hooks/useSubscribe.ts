import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SubscriptionRequestItem, SubscriptionResult } from '@declarations/subs/subs.did.d.ts';
import { getAuthenticatedSubsActor, getPlugSubsActor } from '../canister/subs';
import { useAuth } from '../auth/AuthProvider';

export function useSubscribe() {
  const { identity, authMethod } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<SubscriptionResult, Error, SubscriptionRequestItem[]>({
    mutationFn: async (items) => {
      let actor;
      if (authMethod === 'plug') {
        actor = await getPlugSubsActor();
      } else {
        if (!identity) throw new Error('Not authenticated');
        actor = await getAuthenticatedSubsActor(identity);
      }
      // SubscriptionRequest is Array<Array<SubscriptionRequestItem>> — one subscription per inner array
      return actor.icrc79_subscribe([items]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['serviceLeaderboard'] });
    },
  });
}
