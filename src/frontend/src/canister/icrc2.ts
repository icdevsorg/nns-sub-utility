import { IDL } from '@dfinity/candid';
import { Actor, type ActorSubclass, type Identity } from '@dfinity/agent';
import { createAuthenticatedAgent, getAnonymousAgent } from '../agent';
import { CONFIG } from '../config';
import { idlFactory as icdvTokenIdlFactory } from '../../../../../ICDevsToken/src/declarations/token/token.did.js';
import type { Principal } from '@dfinity/principal';

const ICDV_TOKEN_CANISTER_ID = 'agtsn-xyaaa-aaaag-ak3kq-cai';

/* ── Minimal ICRC-1 / ICRC-2 IDL ─────────────────────────── */

const Account = IDL.Record({
  owner: IDL.Principal,
  subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
});

const ApproveArgs = IDL.Record({
  fee: IDL.Opt(IDL.Nat),
  memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
  from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  created_at_time: IDL.Opt(IDL.Nat64),
  amount: IDL.Nat,
  expected_allowance: IDL.Opt(IDL.Nat),
  expires_at: IDL.Opt(IDL.Nat64),
  spender: Account,
});

const ApproveError = IDL.Variant({
  GenericError: IDL.Record({ message: IDL.Text, error_code: IDL.Nat }),
  TemporarilyUnavailable: IDL.Null,
  Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
  BadFee: IDL.Record({ expected_fee: IDL.Nat }),
  AllowanceChanged: IDL.Record({ current_allowance: IDL.Nat }),
  CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
  TooOld: IDL.Null,
  Expired: IDL.Record({ ledger_time: IDL.Nat64 }),
  InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
});

const AllowanceArgs = IDL.Record({
  account: Account,
  spender: Account,
});

const AllowanceResult = IDL.Record({
  allowance: IDL.Nat,
  expires_at: IDL.Opt(IDL.Nat64),
});

const MetadataValue = IDL.Variant({
  Nat: IDL.Nat,
  Int: IDL.Int,
  Text: IDL.Text,
  Blob: IDL.Vec(IDL.Nat8),
});

export const icrc2IdlFactory: IDL.InterfaceFactory = ({ IDL: _IDL }) => {
  return IDL.Service({
    icrc1_name: IDL.Func([], [IDL.Text], ['query']),
    icrc1_symbol: IDL.Func([], [IDL.Text], ['query']),
    icrc1_decimals: IDL.Func([], [IDL.Nat8], ['query']),
    icrc1_fee: IDL.Func([], [IDL.Nat], ['query']),
    icrc1_metadata: IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Text, MetadataValue))], ['query']),
    icrc2_approve: IDL.Func(
      [ApproveArgs],
      [IDL.Variant({ Ok: IDL.Nat, Err: ApproveError })],
      [],
    ),
    icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ['query']),
    icrc2_allowance: IDL.Func(
      [AllowanceArgs],
      [AllowanceResult],
      ['query'],
    ),
  });
};

export function resolveTokenIdlFactory(canisterId: string): IDL.InterfaceFactory {
  if (canisterId === ICDV_TOKEN_CANISTER_ID) {
    return icdvTokenIdlFactory as unknown as IDL.InterfaceFactory;
  }

  return icrc2IdlFactory;
}

/* ── Service interface (TS) ──────────────────────────────── */

export interface ICRC2Account {
  owner: Principal;
  subaccount: [] | [Uint8Array | number[]];
}

export interface ICRC2ApproveArgs {
  fee: [] | [bigint];
  memo: [] | [Uint8Array | number[]];
  from_subaccount: [] | [Uint8Array | number[]];
  created_at_time: [] | [bigint];
  amount: bigint;
  expected_allowance: [] | [bigint];
  expires_at: [] | [bigint];
  spender: ICRC2Account;
}

export type ICRC2ApproveResult =
  | { Ok: bigint }
  | { Err: Record<string, unknown> };

export interface ICRC2AllowanceResult {
  allowance: bigint;
  expires_at: [] | [bigint];
}

export interface ICRC2Service {
  icrc1_name: () => Promise<string>;
  icrc1_symbol: () => Promise<string>;
  icrc1_decimals: () => Promise<number>;
  icrc1_fee: () => Promise<bigint>;
  icrc1_metadata: () => Promise<Array<[string, { Nat?: bigint; Int?: bigint; Text?: string; Blob?: Uint8Array }]>>;
  icrc1_balance_of: (args: ICRC2Account) => Promise<bigint>;
  icrc2_approve: (args: ICRC2ApproveArgs) => Promise<ICRC2ApproveResult>;
  icrc2_allowance: (args: { account: ICRC2Account; spender: ICRC2Account }) => Promise<ICRC2AllowanceResult>;
}

export type ICRC2Actor = ActorSubclass<ICRC2Service>;

export async function getTokenActor(canisterId: string): Promise<ICRC2Actor> {
  const agent = await getAnonymousAgent();
  return Actor.createActor<ICRC2Service>(resolveTokenIdlFactory(canisterId), { agent, canisterId });
}

export async function getAuthenticatedTokenActor(canisterId: string, identity: Identity): Promise<ICRC2Actor> {
  const agent = await createAuthenticatedAgent(identity);
  return Actor.createActor<ICRC2Service>(resolveTokenIdlFactory(canisterId), { agent, canisterId });
}

export async function getPlugTokenActor(canisterId: string): Promise<ICRC2Actor> {
  const plug = (window as any).ic?.plug;
  if (!plug) {
    throw new Error('Plug wallet is not available');
  }

  await plug.requestConnect({
    whitelist: [CONFIG.SUBS_CANISTER_ID, canisterId],
    host: CONFIG.IC_HOST,
  });

  return plug.createActor({
    canisterId,
    interfaceFactory: resolveTokenIdlFactory(canisterId),
  });
}
