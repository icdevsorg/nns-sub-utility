import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedSubsActor, getPlugSubsActor } from '../canister/subs';
import type { Identity } from '@dfinity/agent';
import type { CancelResult } from '@declarations/subs/subs.did.d.ts';
import type { AuthMethod } from '../auth/AuthProvider';

interface CancelArgs {
  identity: Identity | null;
  authMethod: AuthMethod;
  subscriptions: { subscriptionId: bigint; reason: string }[];
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ identity, authMethod, subscriptions }: CancelArgs): Promise<CancelResult[]> => {
      const actor = authMethod === 'plug'
        ? await getPlugSubsActor()
        : await getAuthenticatedSubsActor(identity!);
      return actor.icrc79_cancel_subscription(subscriptions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionDetail'] });
      queryClient.invalidateQueries({ queryKey: ['serviceLeaderboard'] });
    },
  });
}
