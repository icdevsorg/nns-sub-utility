import { useQuery } from '@tanstack/react-query';
import { getSubsActor } from '../canister/subs';
import { CONFIG } from '../config';

export function useMetadata() {
  return useQuery({
    queryKey: ['icrc79-metadata'],
    queryFn: async () => {
      const actor = await getSubsActor();
      const meta = await actor.icrc79_metadata();
      // Convert array of [key, Value] tuples into a Map for easy lookup
      return new Map(meta.map(([k, v]) => [k, v]));
    },
    refetchInterval: CONFIG.REFETCH_INTERVAL,
    staleTime: CONFIG.STALE_TIME,
  });
}
