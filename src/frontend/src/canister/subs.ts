import { Actor, type ActorSubclass } from '@dfinity/agent';
import { getAnonymousAgent, createAuthenticatedAgent } from '../agent';
import { CONFIG } from '../config';
import { idlFactory as subsIdlFactory } from '@declarations/subs/subs.did.js';
import type {
  _SERVICE as SubsService,
  Subscription,
  PaymentRecord,
  PendingPayment,
  ServiceNotification,
  TokenInfo,
  SubStatus,
  Interval,
} from '@declarations/subs/subs.did.d.ts';
import type { Identity } from '@dfinity/agent';

export type SubsActor = ActorSubclass<SubsService>;
export type { Subscription, PaymentRecord, PendingPayment, ServiceNotification, TokenInfo, SubStatus, Interval };

let anonActorInstance: SubsActor | null = null;

export async function getSubsActor(): Promise<SubsActor> {
  if (anonActorInstance) return anonActorInstance;

  const agent = await getAnonymousAgent();
  anonActorInstance = Actor.createActor<SubsService>(subsIdlFactory, {
    agent,
    canisterId: CONFIG.SUBS_CANISTER_ID,
  });

  return anonActorInstance;
}

export async function getAuthenticatedSubsActor(identity: Identity): Promise<SubsActor> {
  const agent = await createAuthenticatedAgent(identity);
  return Actor.createActor<SubsService>(subsIdlFactory, {
    agent,
    canisterId: CONFIG.SUBS_CANISTER_ID,
  });
}

export async function getPlugSubsActor(): Promise<SubsActor> {
  return (window as any).ic.plug.createActor({
    canisterId: CONFIG.SUBS_CANISTER_ID,
    interfaceFactory: subsIdlFactory,
  });
}
