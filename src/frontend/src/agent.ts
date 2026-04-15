import { Actor, HttpAgent, AnonymousIdentity, type Identity } from '@dfinity/agent';
import { CONFIG } from './config';

let anonymousAgent: HttpAgent | null = null;

export async function getAnonymousAgent(): Promise<HttpAgent> {
  if (anonymousAgent) return anonymousAgent;

  const agent = await HttpAgent.create({
    host: CONFIG.IC_HOST,
    identity: new AnonymousIdentity(),
  });

  // Only fetch root key in local dev — in production the root key is hardcoded and trusted.
  if (import.meta.env.DEV || import.meta.env.VITE_FETCH_ROOT_KEY === 'true') {
    await agent.fetchRootKey();
  }

  anonymousAgent = agent;
  return agent;
}

export async function createAuthenticatedAgent(identity: Identity): Promise<HttpAgent> {
  const agent = await HttpAgent.create({
    host: CONFIG.IC_HOST,
    identity,
  });

  if (import.meta.env.DEV || import.meta.env.VITE_FETCH_ROOT_KEY === 'true') {
    await agent.fetchRootKey();
  }

  return agent;
}

export async function makeActor<T>(
  idlFactory: unknown,
  canisterId: string,
  agent?: HttpAgent,
) {
  const resolvedAgent = agent ?? (await getAnonymousAgent());
  return Actor.createActor<T>(idlFactory as any, { agent: resolvedAgent, canisterId });
}
