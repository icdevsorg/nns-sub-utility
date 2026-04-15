import { useQuery } from '@tanstack/react-query';
import { getSubsActor } from '../canister/subs';
import { CONFIG } from '../config';

export interface BlockEntry {
  id: bigint;
  block: unknown;
}

export function useRecentBlocks() {
  return useQuery({
    queryKey: ['recentBlocks'],
    queryFn: async () => {
      const actor = await getSubsActor();
      const result = await actor.icrc3_get_blocks([{ start: 0n, length: 0n }]);
      const logLength = result.log_length;

      if (logLength === 0n) return { blocks: [] as BlockEntry[], logLength: 0n };

      const count = BigInt(CONFIG.RECENT_BLOCKS_COUNT);
      const start = logLength > count ? logLength - count : 0n;
      const length = logLength > count ? count : logLength;

      const blockResult = await actor.icrc3_get_blocks([{ start, length }]);
      const blocks: BlockEntry[] = blockResult.blocks.map((entry) => ({
        id: entry.id,
        block: entry.block,
      }));
      return { blocks, logLength };
    },
    refetchInterval: CONFIG.REFETCH_INTERVAL,
    staleTime: CONFIG.STALE_TIME,
  });
}
