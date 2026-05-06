import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONFIG } from '../config';
import { getPlugTokenActor, icrc2IdlFactory, resolveTokenIdlFactory } from './icrc2';

describe('getPlugTokenActor', () => {
  beforeEach(() => {
    delete (window as any).ic;
  });

  it('requests access for the selected token canister before creating the actor', async () => {
    const actor = { icrc2_approve: vi.fn() };
    const createActor = vi.fn().mockResolvedValue(actor);
    const requestConnect = vi.fn().mockResolvedValue(undefined);

    (window as any).ic = {
      plug: {
        requestConnect,
        createActor,
      },
    };

    const result = await getPlugTokenActor('agtsn-xyaaa-aaaag-ak3kq-cai');

    expect(requestConnect).toHaveBeenCalledWith({
      whitelist: [CONFIG.SUBS_CANISTER_ID, 'agtsn-xyaaa-aaaag-ak3kq-cai'],
      host: CONFIG.IC_HOST,
    });
    expect(createActor).toHaveBeenCalledWith({
      canisterId: 'agtsn-xyaaa-aaaag-ak3kq-cai',
      interfaceFactory: expect.any(Function),
    });
    expect(result).toBe(actor);
  });

  it('uses the generated ICDV interface for the ICDV token canister', () => {
    expect(resolveTokenIdlFactory('agtsn-xyaaa-aaaag-ak3kq-cai')).not.toBe(icrc2IdlFactory);
  });

  it('uses the generic ICRC-2 interface for other token canisters', () => {
    expect(resolveTokenIdlFactory('ryjl3-tyaaa-aaaaa-aaaba-cai')).toBe(icrc2IdlFactory);
  });

  it('throws when Plug is unavailable', async () => {
    await expect(getPlugTokenActor('agtsn-xyaaa-aaaag-ak3kq-cai')).rejects.toThrow(
      'Plug wallet is not available',
    );
  });
});