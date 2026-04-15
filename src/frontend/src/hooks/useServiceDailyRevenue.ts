import { useQuery } from '@tanstack/react-query';
import { Principal } from '@dfinity/principal';
import type { DailyRevenueEntry } from '@declarations/subs/subs.did.d.ts';
import { getSubsActor } from '../canister/subs';

export function useServiceDailyRevenue(
  servicePrincipal: string | undefined,
  productId: bigint | undefined,
  startDate: bigint,
  endDate: bigint,
) {
  return useQuery<DailyRevenueEntry[]>({
    queryKey: ['serviceDailyRevenue', servicePrincipal, productId?.toString(), startDate.toString(), endDate.toString()],
    queryFn: async () => {
      if (!servicePrincipal) return [];
      const actor = await getSubsActor();
      return actor.icrc79_service_daily_revenue(
        Principal.fromText(servicePrincipal),
        productId !== undefined ? [productId] : [],
        startDate,
        endDate,
      );
    },
    enabled: !!servicePrincipal,
    staleTime: 60_000,
  });
}
