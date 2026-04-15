import { useQuery } from '@tanstack/react-query';
import { Principal } from '@dfinity/principal';
import { getTokenActor } from '../canister/icrc2';
import { CONFIG } from '../config';

export function useAllowance(tokenCanisterId: string | undefined, ownerPrincipal: string | null) {
  return useQuery({
    queryKey: ['allowance', tokenCanisterId, ownerPrincipal],
    queryFn: async () => {
      if (!tokenCanisterId || !ownerPrincipal) return { allowance: 0n, expires_at: [] as [] };
      const actor = await getTokenActor(tokenCanisterId);
      const result = await actor.icrc2_allowance({
        account: {
          owner: Principal.fromText(ownerPrincipal),
          subaccount: [],
        },
        spender: {
          owner: Principal.fromText(CONFIG.SUBS_CANISTER_ID),
          subaccount: [],
        },
      });
      return result;
    },
    enabled: !!tokenCanisterId && !!ownerPrincipal,
    refetchInterval: 10_000,
  });
}
