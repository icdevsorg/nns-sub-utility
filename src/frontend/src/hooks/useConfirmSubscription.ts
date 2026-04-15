import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ConfirmRequests, ConfirmResult } from '@declarations/subs/subs.did.d.ts';
import { getAuthenticatedSubsActor, getPlugSubsActor } from '../canister/subs';
import { useAuth } from '../auth/AuthProvider';

export function useConfirmSubscription() {
  const { identity, authMethod } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ConfirmResult[], Error, ConfirmRequests[]>({
    mutationFn: async (requests) => {
      let actor;
      if (authMethod === 'plug') {
        actor = await getPlugSubsActor();
      } else {
        if (!identity) throw new Error('Not authenticated');
        actor = await getAuthenticatedSubsActor(identity);
      }
      return actor.icrc79_confirm_subscription(requests);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['serviceNotifications'] });
    },
  });
}
