import { useQuery } from '@tanstack/react-query';
import { Principal } from '@dfinity/principal';
import type { ServiceSubscriptionFilter, Subscription } from '@declarations/subs/subs.did.d.ts';
import { getSubsActor } from '../canister/subs';
import { CONFIG } from '../config';

export function useServiceSubscriptions(
  servicePrincipal: string | undefined,
  filter?: ServiceSubscriptionFilter,
  prev?: bigint,
) {
  return useQuery<Subscription[]>({
    queryKey: ['serviceSubscriptions', servicePrincipal, filter, prev?.toString()],
    queryFn: async () => {
      if (!servicePrincipal) return [];
      const actor = await getSubsActor();
      return actor.icrc79_get_service_subscriptions(
        Principal.fromText(servicePrincipal),
        filter ? [filter] : [],
        prev !== undefined ? [prev] : [],
        [BigInt(CONFIG.PAGE_SIZE)],
      );
    },
    enabled: !!servicePrincipal,
  });
}
