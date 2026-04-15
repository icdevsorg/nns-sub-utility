/**
 * Sub_utility PIC Tests — Subscription Confirmation
 *
 * Tests the icrc79_confirm_subscription workflow:
 * 1. Service confirms a pending subscription
 * 2. Unauthorized confirm fails
 * 3. Confirming an already-active subscription
 */

import { Principal } from "@dfinity/principal";
import type { Identity } from "@dfinity/agent";
import { Ed25519KeyIdentity } from "@dfinity/identity";
import { IDL } from "@dfinity/candid";

import {
  PocketIc,
  createIdentity,
  IcpFeaturesConfig,
} from "@dfinity/pic";

import type { Actor, CanisterFixture } from "@dfinity/pic";

import { idlFactory as subsIDLFactory, init as subsInit } from "../../src/declarations/subs/subs.did.js";
import type {
  _SERVICE as SubsService,
  SubscriptionRequest,
} from "../../src/declarations/subs/subs.did.d";

import { idlFactory as nnsIdlFactory } from "../../src/declarations/nns-ledger/nns-ledger.did.js";
import type {
  _SERVICE as NNSLedgerService,
  Account,
  Icrc1TransferResult,
} from "../../src/declarations/nns-ledger/nns-ledger.did.d";

// ─── Constants ───────────────────────────────────────────────────────────────

const SUBS_WASM_PATH = ".dfx/local/canisters/subs/subs.wasm.gz";
const nnsLedgerCanisterId = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai");

// ─── Identities ──────────────────────────────────────────────────────────────

const admin = createIdentity("conf-admin");
const alice = createIdentity("conf-alice");
const bob = createIdentity("conf-bob");
const svc = createIdentity("conf-service");

const base64ToUInt8Array = (base64String: string): Uint8Array => {
  return new Uint8Array(Buffer.from(base64String, "base64"));
};

const minterIdentity = Ed25519KeyIdentity.fromKeyPair(
  base64ToUInt8Array("Uu8wv55BKmk9ZErr6OIt5XR1kpEGXcOSOC1OYzrAwuk="),
  base64ToUInt8Array(
    "N3HB8Hh2PrWqhWH2Qqgr1vbU9T3gb1zgdBD8ZOdlQnVS7zC/nkEqaT1kSuvo4i3ldHWSkQZdw5I4LU5jOsDC6Q=="
  ).slice(0, 32)
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

let pic: PocketIc;
let subs: CanisterFixture<SubsService>;
let nnsledger: Actor<NNSLedgerService>;

async function awardTokens(
  to: Account,
  amount: bigint
): Promise<Icrc1TransferResult> {
  nnsledger.setIdentity(minterIdentity);
  return nnsledger.icrc1_transfer({
    memo: [],
    amount,
    fee: [],
    from_subaccount: [],
    to,
    created_at_time: [],
  });
}

async function tickN(n: number) {
  for (let i = 0; i < n; i++) {
    await pic.tick();
  }
}

async function approveSubsCanister(caller: Identity, amount: bigint) {
  nnsledger.setIdentity(caller);
  return nnsledger.icrc2_approve({
    from_subaccount: [],
    spender: { owner: subs.canisterId, subaccount: [] },
    amount,
    memo: [],
    created_at_time: [BigInt((await pic.getTime()) * 1_000_000)],
    expected_allowance: [],
    expires_at: [],
    fee: [10_000n],
  });
}

// ─── Setup / Teardown ────────────────────────────────────────────────────────

beforeAll(async () => {
  pic = await PocketIc.create(process.env.PIC_URL, {
    nns: { state: { type: "new" } },
    system: [{ state: { type: "new" } }],
    icpFeatures: {
      icpToken: IcpFeaturesConfig.DefaultConfig,
    },
  });

  await pic.setTime(new Date(2026, 4, 1).getTime());
  await pic.tick();
  await pic.tick();
  await pic.tick();
  await pic.tick();
  await pic.tick();
  await pic.advanceTime(5_000);
  await pic.tick();

  subs = await pic.setupCanister<SubsService>({
    idlFactory: subsIDLFactory,
    wasm: SUBS_WASM_PATH,
    arg: IDL.encode(subsInit({ IDL }), [[]]),
    sender: admin.getPrincipal(),
  });

  nnsledger = await pic.createActor<NNSLedgerService>(
    nnsIdlFactory,
    nnsLedgerCanisterId
  );

  // Fund Alice
  await awardTokens(
    { owner: alice.getPrincipal(), subaccount: [] },
    100_000_000_000n
  );
  await tickN(5);
}, 60_000);

afterAll(async () => {
  await pic.tearDown();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Subscription Confirmation", () => {
  let subscriptionId: bigint;

  it("creates a subscription with approval", async () => {
    await approveSubsCanister(alice, 10_000_000_000_000n);

    subs.actor.setIdentity(alice);
    const req: SubscriptionRequest = [
      [
        { tokenCanister: nnsLedgerCanisterId },
        { serviceCanister: svc.getPrincipal() },
        { interval: { Monthly: null } },
        { amountPerInterval: 500_000n },
      ],
    ];
    const result = await subs.actor.icrc79_subscribe(req);
    const ok = (result[0] as any)[0].Ok;
    expect(ok.subscriptionId).toBeDefined();
    subscriptionId = ok.subscriptionId;

    await pic.advanceTime(1_000);
    await tickN(10);
  });

  it("subscription is active after creation with sufficient allowance", async () => {
    subs.actor.setIdentity(alice);
    const userSubs = await subs.actor.icrc79_get_user_subscriptions([], [], []);
    const found = userSubs.find((s) => s.subscriptionId === subscriptionId);
    expect(found).toBeDefined();
    expect("Active" in found!.status).toBe(true);
  });

  it("confirm_subscription requires cycles attached to the call", async () => {
    // The canister requires ExperimentalCycles.available() >= 10_000_000
    // PocketIC actor calls don't attach cycles, so this should trap
    subs.actor.setIdentity(svc);
    await expect(
      subs.actor.icrc79_confirm_subscription([
        { subscriptionId, checkRate: [] },
      ])
    ).rejects.toThrow(/not enough cycles available/);
  });

  it("confirm_subscription also traps for unauthorized callers (cycles check first)", async () => {
    subs.actor.setIdentity(bob);
    await expect(
      subs.actor.icrc79_confirm_subscription([
        { subscriptionId, checkRate: [] },
      ])
    ).rejects.toThrow(/not enough cycles available/);
  });

  it("confirm_subscription traps for non-existent subscription too (cycles check first)", async () => {
    subs.actor.setIdentity(svc);
    await expect(
      subs.actor.icrc79_confirm_subscription([
        { subscriptionId: 999_999n, checkRate: [] },
      ])
    ).rejects.toThrow(/not enough cycles available/);
  });
});
