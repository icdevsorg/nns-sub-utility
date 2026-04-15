import { useQuery } from '@tanstack/react-query';
import { getSubsActor } from '../canister/subs';
import { CONFIG } from '../config';

export function useTokenInfo() {
  return useQuery({
    queryKey: ['tokenInfo'],
    queryFn: async () => {
      const actor = await getSubsActor();
      return actor.get_token_info();
    },
    refetchInterval: CONFIG.REFETCH_INTERVAL * 2,
    staleTime: 60_000,
  });
}
