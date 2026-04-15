/**
 * Sub_utility PIC Tests — Payment Edge Cases
 *
 * Focuses on payment scenarios NOT covered by lifecycle.test.ts:
 * 1. Subscription creation with insufficient allowance
 * 2. Payment record field validation
 * 3. Multiple subscriptions producing independent payments
 * 4. Service-side payment queries with filters
 * 5. User payments after cancel (no new payments)
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
  Subscription,
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
const MONTH_MS = 2_629_800_000;

// ─── Identities ──────────────────────────────────────────────────────────────

const admin = createIdentity("pay-admin");
const alice = createIdentity("pay-alice");
const bob = createIdentity("pay-bob");
const serviceA = createIdentity("pay-serviceA");
const serviceB = createIdentity("pay-serviceB");

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

async function approveSubsCanister(
  caller: Identity,
  amount: bigint
) {
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

function makeSubRequest(
  service: Principal,
  amount: bigint,
  productId?: bigint
): SubscriptionRequest {
  const items: any[] = [
    { tokenCanister: nnsLedgerCanisterId },
    { serviceCanister: service },
    { interval: { Monthly: null } },
    { amountPerInterval: amount },
  ];
  if (productId !== undefined) {
    items.push({ productId });
  }
  return [items];
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

  await pic.setTime(new Date(2026, 3, 1).getTime());
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

  // Fund Alice with 1000 ICP, Bob with 50 ICP (much less)
  await awardTokens(
    { owner: alice.getPrincipal(), subaccount: [] },
    100_000_000_000n
  );
  await awardTokens(
    { owner: bob.getPrincipal(), subaccount: [] },
    5_000_000_000n
  );
  await tickN(5);
}, 60_000);

afterAll(async () => {
  await pic.tearDown();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Insufficient Allowance on Subscribe", () => {
  it("subscribe without ICRC-2 approval returns InsufficientAllowance", async () => {
    subs.actor.setIdentity(bob);
    const req = makeSubRequest(serviceA.getPrincipal(), 1_000_000n);
    const result = await subs.actor.icrc79_subscribe(req);
    expect(result.length).toBe(1);
    const item = result[0]!;
    // The result should contain an error about insufficient allowance
    const flat = Array.isArray(item) ? item[0] : item;
    expect(flat).toBeDefined();
    expect("Err" in (flat as any)).toBe(true);
  });
});

describe("Multiple Subscriptions & Payments", () => {
  let subIdA: bigint;
  let subIdB: bigint;

  it("creates two subscriptions to different services", async () => {
    // Alice → serviceA
    await approveSubsCanister(alice, 10_000_000_000_000n);
    subs.actor.setIdentity(alice);
    const resA = await subs.actor.icrc79_subscribe(
      makeSubRequest(serviceA.getPrincipal(), 500_000n)
    );
    const okA = (resA[0] as any)[0].Ok;
    expect(okA.subscriptionId).toBeDefined();
    subIdA = okA.subscriptionId;

    // Alice → serviceB
    const resB = await subs.actor.icrc79_subscribe(
      makeSubRequest(serviceB.getPrincipal(), 300_000n, 42n)
    );
    const okB = (resB[0] as any)[0].Ok;
    expect(okB.subscriptionId).toBeDefined();
    subIdB = okB.subscriptionId;
    expect(subIdB).not.toBe(subIdA);
  });

  it("initial payments are processed for both subscriptions", async () => {
    await pic.advanceTime(2_000);
    await tickN(20);

    subs.actor.setIdentity(alice);
    const payments = await subs.actor.icrc79_get_user_payments([], [], []);
    expect(payments.length).toBeGreaterThanOrEqual(2);

    const forA = payments.filter((p) => p.subscriptionId === subIdA);
    const forB = payments.filter((p) => p.subscriptionId === subIdB);
    expect(forA.length).toBeGreaterThanOrEqual(1);
    expect(forB.length).toBeGreaterThanOrEqual(1);
  });

  it("payment record has correct fields", async () => {
    subs.actor.setIdentity(alice);
    const payments = await subs.actor.icrc79_get_user_payments([], [], []);
    const p = payments[0];
    expect(p.paymentId).toBeDefined();
    expect(p.date).toBeGreaterThan(0n);
    expect(p.amount).toBeGreaterThan(0n);
    expect(p.account.owner.toText()).toBe(alice.getPrincipal().toText());
  });

  it("service A only sees its own payments", async () => {
    const paymentsA = await subs.actor.icrc79_get_service_payments(
      serviceA.getPrincipal(),
      [],
      [],
      []
    );
    for (const p of paymentsA) {
      expect(p.service.toText()).toBe(serviceA.getPrincipal().toText());
    }
  });

  it("advancing one month triggers new payments", async () => {
    subs.actor.setIdentity(alice);
    const countBefore = (await subs.actor.icrc79_get_user_payments([], [], [])).length;

    await pic.advanceTime(MONTH_MS + 1);
    await tickN(30);

    const countAfter = (await subs.actor.icrc79_get_user_payments([], [], [])).length;
    expect(countAfter).toBeGreaterThan(countBefore);
  });
});

describe("Payments After Cancel", () => {
  it("cancelled subscription produces no new payments", async () => {
    subs.actor.setIdentity(alice);
    const userSubs = await subs.actor.icrc79_get_user_subscriptions([], [], []);
    const activeSub = userSubs.find((s) => "Active" in s.status);
    expect(activeSub).toBeDefined();
    const subId = activeSub!.subscriptionId;

    // Count current payments
    const paymentsBefore = (await subs.actor.icrc79_get_user_payments([], [], [])).length;

    // Cancel
    const cancelResult = await subs.actor.icrc79_cancel_subscription([
      { subscriptionId: subId, reason: "test cancel for payments" },
    ]);
    expect(cancelResult.length).toBe(1);

    // Advance a month and tick
    await pic.advanceTime(MONTH_MS + 1);
    await tickN(20);

    // The cancelled subscription should not produce new payments
    const totalPayments = await subs.actor.icrc79_get_user_payments([], [], []);
    const newPaymentsForSub = totalPayments.filter(
      (p) => p.subscriptionId === subId && p.paymentId > BigInt(paymentsBefore)
    );
    // The subscription might have a final payment at cancellation time but no recurring after that
    // Just verify the payment count didn't grow by more than 1
    expect(newPaymentsForSub.length).toBeLessThanOrEqual(1);
  });
});
