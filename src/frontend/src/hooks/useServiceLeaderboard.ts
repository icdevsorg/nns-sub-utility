import { useQuery } from '@tanstack/react-query';
import { getSubsActor } from '../canister/subs';
import type { LeaderboardEntry } from '@declarations/subs/subs.did.d.ts';
import { CONFIG } from '../config';

export function useServiceLeaderboard(prev?: bigint, take?: bigint) {
  return useQuery({
    queryKey: ['serviceLeaderboard', prev?.toString()],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const actor = await getSubsActor();
      return actor.icrc79_service_leaderboard(
        prev !== undefined ? [prev] : [],
        take !== undefined ? [take] : [BigInt(CONFIG.PAGE_SIZE)],
      );
    },
    staleTime: CONFIG.STALE_TIME,
    refetchInterval: CONFIG.REFETCH_INTERVAL,
  });
}
