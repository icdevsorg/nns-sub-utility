import { useQuery } from '@tanstack/react-query';
import { getTokenActor } from '../canister/icrc2';

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  fee: bigint;
}

interface UseTokenMetadataOptions {
  enabled?: boolean;
  initialData?: TokenMetadata | null;
}

export function useTokenMetadata(canisterId: string | undefined, options?: UseTokenMetadataOptions) {
  return useQuery<TokenMetadata | null>({
    queryKey: ['tokenMetadata', canisterId],
    queryFn: async () => {
      if (!canisterId) return null;
      const actor = await getTokenActor(canisterId);
      const [name, symbol, decimals, fee] = await Promise.all([
        actor.icrc1_name(),
        actor.icrc1_symbol(),
        actor.icrc1_decimals(),
        actor.icrc1_fee(),
      ]);
      return { name, symbol, decimals, fee };
    },
    enabled: options?.enabled ?? !!canisterId,
    initialData: options?.initialData,
    staleTime: 5 * 60 * 1000, // 5 minutes — token metadata rarely changes
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
