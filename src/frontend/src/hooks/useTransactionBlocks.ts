import { useQuery } from '@tanstack/react-query';
import { getSubsActor } from '../canister/subs';
import { CONFIG } from '../config';
import type { BlockEntry } from './useRecentBlocks';

export type { BlockEntry };

/**
 * Paginated block fetcher for the Transactions page.
 * page is 0-indexed; blocks are fetched in reverse order (newest first).
 */
export function useTransactionBlocks(page: number) {
  return useQuery({
    queryKey: ['transactionBlocks', page],
    queryFn: async () => {
      const actor = await getSubsActor();
      // First get log length
      const probe = await actor.icrc3_get_blocks([{ start: 0n, length: 0n }]);
      const logLength = probe.log_length;

      if (logLength === 0n) return { blocks: [] as BlockEntry[], logLength: 0n, page };

      const pageSize = BigInt(CONFIG.TRANSACTIONS_PAGE_SIZE);
      const offset = BigInt(page) * pageSize;

      // Calculate start from the end (newest first)
      const endPos = logLength > offset ? logLength - offset : 0n;
      const start = endPos > pageSize ? endPos - pageSize : 0n;
      const length = endPos > pageSize ? pageSize : endPos;

      if (length === 0n) return { blocks: [] as BlockEntry[], logLength, page };

      const result = await actor.icrc3_get_blocks([{ start, length }]);
      return {
        blocks: [...result.blocks]
          .reverse()
          .map((entry) => ({
            id: entry.id,
            block: entry.block,
          })) as BlockEntry[],
        logLength: result.log_length,
        page,
      };
    },
    staleTime: CONFIG.STALE_TIME,
  });
}
