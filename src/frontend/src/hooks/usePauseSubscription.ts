import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedSubsActor, getPlugSubsActor } from '../canister/subs';
import type { Identity } from '@dfinity/agent';
import type { PauseResult, PauseRequestItem } from '@declarations/subs/subs.did.d.ts';
import type { AuthMethod } from '../auth/AuthProvider';

interface PauseArgs {
  identity: Identity | null;
  authMethod: AuthMethod;
  items: PauseRequestItem[];
}

export function usePauseSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ identity, authMethod, items }: PauseArgs): Promise<PauseResult[]> => {
      const actor = authMethod === 'plug'
        ? await getPlugSubsActor()
        : await getAuthenticatedSubsActor(identity!);
      return actor.icrc79_pause_subscription(items);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionDetail'] });
      queryClient.invalidateQueries({ queryKey: ['serviceLeaderboard'] });
    },
  });
}
