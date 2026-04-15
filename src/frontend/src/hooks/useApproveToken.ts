import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Principal } from '@dfinity/principal';
import { getAuthenticatedTokenActor, getPlugTokenActor, type ICRC2ApproveResult } from '../canister/icrc2';
import { useAuth } from '../auth/AuthProvider';
import { CONFIG } from '../config';

interface ApproveParams {
  tokenCanisterId: string;
  amount: bigint;
}

export function useApproveToken() {
  const { identity, authMethod } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ICRC2ApproveResult, Error, ApproveParams>({
    mutationFn: async ({ tokenCanisterId, amount }) => {
      let actor;
      if (authMethod === 'plug') {
        actor = await getPlugTokenActor(tokenCanisterId);
      } else {
        if (!identity) throw new Error('Not authenticated');
        actor = await getAuthenticatedTokenActor(tokenCanisterId, identity);
      }
      return actor.icrc2_approve({
        amount,
        spender: {
          owner: Principal.fromText(CONFIG.SUBS_CANISTER_ID),
          subaccount: [],
        },
        fee: [],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
        expected_allowance: [],
        expires_at: [],
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allowance', variables.tokenCanisterId] });
    },
  });
}
