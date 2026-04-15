import { useQuery } from '@tanstack/react-query';
import { Principal } from '@dfinity/principal';
import type { ServiceSubscriptionFilter, PaymentRecord } from '@declarations/subs/subs.did.d.ts';
import { getSubsActor } from '../canister/subs';
import { CONFIG } from '../config';

export function useServicePayments(
  servicePrincipal: string | undefined,
  filter?: ServiceSubscriptionFilter,
  prev?: bigint,
) {
  return useQuery<PaymentRecord[]>({
    queryKey: ['servicePayments', servicePrincipal, filter, prev?.toString()],
    queryFn: async () => {
      if (!servicePrincipal) return [];
      const actor = await getSubsActor();
      return actor.icrc79_get_service_payments(
        Principal.fromText(servicePrincipal),
        filter ? [filter] : [],
        prev !== undefined ? [prev] : [],
        [BigInt(CONFIG.PAGE_SIZE)],
      );
    },
    enabled: !!servicePrincipal,
  });
}
