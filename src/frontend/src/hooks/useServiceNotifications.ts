import { useQuery } from '@tanstack/react-query';
import { Principal } from '@dfinity/principal';
import type { ServiceNotification } from '@declarations/subs/subs.did.d.ts';
import { getSubsActor } from '../canister/subs';
import { CONFIG } from '../config';

export function useServiceNotifications(
  servicePrincipal: string | undefined,
  prev?: bigint,
) {
  return useQuery<ServiceNotification[]>({
    queryKey: ['serviceNotifications', servicePrincipal, prev?.toString()],
    queryFn: async () => {
      if (!servicePrincipal) return [];
      const actor = await getSubsActor();
      return actor.icrc79_get_service_notifications(
        Principal.fromText(servicePrincipal),
        prev !== undefined ? [prev] : [],
        [BigInt(CONFIG.PAGE_SIZE)],
      );
    },
    enabled: !!servicePrincipal,
  });
}
