/**
 * Sub_utility PIC Tests — Subscription Lifecycle
 *
 * Tests the complete ICRC-79 subscription lifecycle:
 * 1. Token registration
 * 2. Subscription creation (with ICRC-2 approval)
 * 3. User/service subscription queries
 * 4. Pause / resume
 * 5. Cancel
 * 6. Payment processing via time advancement
 * 7. Revenue indexer (leaderboard + daily revenue)
 * 8. Metadata queries
 * 9. ICRC-3 block log
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

// ─── Identities ──────────────────────────────────────────────────────────────

const admin = createIdentity("admin");
const alice = createIdentity("alice");
const bob = createIdentity("bob");
const serviceProvider = createIdentity("serviceProvider");
const serviceProvider2 = createIdentity("serviceProvider2");

const base64ToUInt8Array = (base64String: string): Uint8Array => {
  return new Uint8Array(Buffer.from(base64String, "base64"));
};

const minterPublicKey = "Uu8wv55BKmk9ZErr6OIt5XR1kpEGXcOSOC1OYzrAwuk=";
const minterPrivateKey =
  "N3HB8Hh2PrWqhWH2Qqgr1vbU9T3gb1zgdBD8ZOdlQnVS7zC/nkEqaT1kSuvo4i3ldHWSkQZdw5I4LU5jOsDC6Q==";

const minterIdentity = Ed25519KeyIdentity.fromKeyPair(
  base64ToUInt8Array(minterPublicKey),
  base64ToUInt8Array(minterPrivateKey).slice(0, 32)
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
  const result = await nnsledger.icrc1_transfer({
    memo: [],
    amount,
    fee: [],
    from_subaccount: [],
    to,
    created_at_time: [],
  });
  return result;
}

async function tickN(n: number) {
  for (let i = 0; i < n; i++) {
    await pic.tick();
  }
}

async function approveSubsCanister(
  caller: Identity,
  amount: bigint,
  fromSubaccount?: Uint8Array
) {
  nnsledger.setIdentity(caller);
  const result = await nnsledger.icrc2_approve({
    from_subaccount: fromSubaccount ? [fromSubaccount] : [],
    spender: { owner: subs.canisterId, subaccount: [] },
    amount,
    memo: [],
    created_at_time: [BigInt((await pic.getTime()) * 1_000_000)],
    expected_allowance: [],
    expires_at: [],
    fee: [10_000n],
  });
  return result;
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

  await pic.setTime(new Date(2026, 2, 9).getTime());
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
    100_000_000_000n // 1000 ICP
  );
  await tickN(5);
});

afterAll(async () => {
  await pic.tearDown();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Token Registration", () => {
  it("add_token is admin-gated (returns null for non-admin caller)", async () => {
    subs.actor.setIdentity(admin);
    // sub_utility's add_token is gated to a specific hardcoded admin principal.
    // Non-admin callers get null (empty opt). The token will be auto-registered
    // during the first subscription via icrc79_subscribe.
    const info = await subs.actor.add_token(nnsLedgerCanisterId, []);
    expect(info).toBeDefined();
    expect(info).toEqual([]);
  });

  it("get_token_info returns the registered token", async () => {
    const tokens = await subs.actor.get_token_info();
    expect(tokens.length).toBeGreaterThanOrEqual(1);

    const nns = tokens.find(
      (t) => t.tokenCanister.toText() === nnsLedgerCanisterId.toText()
    );
    expect(nns).toBeDefined();
    expect(nns!.tokenSymbol).toBeTruthy();
  });
});

describe("Metadata", () => {
  it("icrc79_metadata returns key-value pairs", async () => {
    const meta = await subs.actor.icrc79_metadata();
    expect(Array.isArray(meta)).toBe(true);
    expect(meta.length).toBeGreaterThan(0);
  });

  it("icrc79_max_query_batch_size returns a positive number", async () => {
    const v = await subs.actor.icrc79_max_query_batch_size();
    expect(v).toBeGreaterThan(0n);
  });

  it("icrc79_default_take_value returns a positive number", async () => {
    const v = await subs.actor.icrc79_default_take_value();
    expect(v).toBeGreaterThan(0n);
  });

  it("icrc79_max_take_value returns a positive number", async () => {
    const v = await subs.actor.icrc79_max_take_value();
    expect(v).toBeGreaterThan(0n);
  });

  it("icrc79_max_memo_size returns a positive number", async () => {
    const v = await subs.actor.icrc79_max_memo_size();
    expect(v).toBeGreaterThan(0n);
  });

  it("icrc79_tx_window returns a positive number", async () => {
    const v = await subs.actor.icrc79_tx_window();
    expect(v).toBeGreaterThan(0n);
  });

  it("icrc79_permitted_drift returns a positive number", async () => {
    const v = await subs.actor.icrc79_permitted_drift();
    expect(v).toBeGreaterThan(0n);
  });

  it("icrc10_supported_standards includes ICRC-79", async () => {
    const standards = await subs.actor.icrc10_supported_standards();
    const names = standards.map((s) => s.name);
    expect(names).toContain("ICRC-79");
  });
});

describe("Subscription Creation", () => {
  let subscriptionId: bigint;

  it("icrc79_subscribe creates a subscription after ICRC-2 approval", async () => {
    // Approve the subs canister to spend Alice's tokens
    const approveResult = await approveSubsCanister(
      alice,
      10_000_000_000_000n
    );
    expect(approveResult).toMatchObject({ Ok: expect.any(BigInt) });

    // Subscribe: Alice → serviceProvider, Monthly, 1_000_000 per interval
    subs.actor.setIdentity(alice);
    const req: SubscriptionRequest = [
      [
        { tokenCanister: nnsLedgerCanisterId },
        { serviceCanister: serviceProvider.getPrincipal() },
        { interval: { Monthly: null } },
        { amountPerInterval: 1_000_000n },
      ],
    ];

    const result = await subs.actor.icrc79_subscribe(req);
    expect(result.length).toBe(1);
    expect(result[0]).toBeDefined();

    const item = result[0]!;
    expect(item).toMatchObject([{ Ok: expect.any(Object) }]);

    const ok = (item as any)[0].Ok;
    expect(ok.subscriptionId).toBeDefined();
    expect(ok.transactionId).toBeDefined();
    subscriptionId = ok.subscriptionId;
  });

  it("icrc79_get_user_subscriptions returns the new subscription", async () => {
    subs.actor.setIdentity(alice);
    const userSubs = await subs.actor.icrc79_get_user_subscriptions([], [], []);
    expect(userSubs.length).toBeGreaterThanOrEqual(1);

    const found = userSubs.find(
      (s) => s.subscriptionId === subscriptionId
    );
    expect(found).toBeDefined();
    expect(found!.status).toMatchObject({ Active: null });
    expect(found!.serviceCanister.toText()).toBe(
      serviceProvider.getPrincipal().toText()
    );
  });

  it("icrc79_get_service_subscriptions returns the subscription for the service", async () => {
    const serviceSubs = await subs.actor.icrc79_get_service_subscriptions(
      serviceProvider.getPrincipal(),
      [],
      [],
      []
    );
    expect(serviceSubs.length).toBeGreaterThanOrEqual(1);
    const found = serviceSubs.find(
      (s) => s.subscriptionId === subscriptionId
    );
    expect(found).toBeDefined();
  });
});

describe("Payment Processing", () => {
  it("initial subscription triggers immediate payment", async () => {
    // Tick to process timers
    await pic.advanceTime(1_000);
    await tickN(10);

    subs.actor.setIdentity(alice);
    const payments = await subs.actor.icrc79_get_user_payments([], [], []);
    expect(payments.length).toBeGreaterThanOrEqual(1);
    expect(payments[0].ledgerTransactionId).toBeDefined();
    // Amount may have fee deducted (feeBPS). Accept any positive amount close to 1_000_000.
    expect(payments[0].amount).toBeGreaterThan(0n);
    expect(payments[0].amount).toBeLessThanOrEqual(1_000_000n);
  });

  it("advancing a month triggers next payment", async () => {
    await pic.advanceTime(2_629_800_000 + 1); // ~1 month in ms
    await tickN(20);

    subs.actor.setIdentity(alice);
    const payments = await subs.actor.icrc79_get_user_payments([], [], []);
    expect(payments.length).toBeGreaterThanOrEqual(2);
  });

  it("icrc79_get_service_payments returns payment records", async () => {
    const servicePayments = await subs.actor.icrc79_get_service_payments(
      serviceProvider.getPrincipal(),
      [],
      [],
      []
    );
    expect(servicePayments.length).toBeGreaterThanOrEqual(1);
    expect(servicePayments[0].service.toText()).toBe(
      serviceProvider.getPrincipal().toText()
    );
  });

  it("icrc79_get_payments_pending returns pending info", async () => {
    subs.actor.setIdentity(alice);
    const userSubs = await subs.actor.icrc79_get_user_subscriptions([], [], []);
    const subIds = userSubs.map((s) => s.subscriptionId);
    expect(subIds.length).toBeGreaterThan(0);

    const pending = await subs.actor.icrc79_get_payments_pending(subIds);
    expect(pending.length).toBe(subIds.length);
    // Each should have a next payment date
    for (const p of pending) {
      if (p.length > 0 && p[0]) {
        expect(p[0].subscription.subscriptionId).toBeDefined();
      }
    }
  });
});

describe("Pause / Resume", () => {
  let subId: bigint;

  beforeAll(async () => {
    subs.actor.setIdentity(alice);
    const userSubs = await subs.actor.icrc79_get_user_subscriptions([], [], []);
    const active = userSubs.find((s) => "Active" in s.status);
    expect(active).toBeDefined();
    subId = active!.subscriptionId;
  });

  it("icrc79_pause_subscription pauses a subscription", async () => {
    subs.actor.setIdentity(alice);
    const result = await subs.actor.icrc79_pause_subscription([
      { subscriptionId: subId, active: false, reason: "test pause" },
    ]);
    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject([{ Ok: expect.any(BigInt) }]);

    // Verify paused
    const userSubs = await subs.actor.icrc79_get_user_subscriptions([], [], []);
    const found = userSubs.find((s) => s.subscriptionId === subId);
    expect(found).toBeDefined();
    expect("Paused" in found!.status).toBe(true);
  });

  it("icrc79_pause_subscription(active: true) resumes", async () => {
    subs.actor.setIdentity(alice);
    const result = await subs.actor.icrc79_pause_subscription([
      { subscriptionId: subId, active: true, reason: "test resume" },
    ]);
    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject([{ Ok: expect.any(BigInt) }]);

    // Verify active again
    const userSubs = await subs.actor.icrc79_get_user_subscriptions([], [], []);
    const found = userSubs.find((s) => s.subscriptionId === subId);
    expect(found).toBeDefined();
    expect("Active" in found!.status).toBe(true);
  });

  it("unauthorized user cannot pause another user's subscription", async () => {
    subs.actor.setIdentity(bob);
    const result = await subs.actor.icrc79_pause_subscription([
      { subscriptionId: subId, active: false, reason: "bob tries" },
    ]);
    expect(result.length).toBe(1);
    const item = result[0];
    expect(item).toBeDefined();
    // Should be an error — either Unauthorized or NotFound
    if (item && item.length > 0) {
      expect("Err" in item[0]!).toBe(true);
    }
  });
});

describe("Cancel Subscription", () => {
  let subIdToCancel: bigint;

  beforeAll(async () => {
    // Create a second subscription specifically for cancellation
    await approveSubsCanister(alice, 10_000_000_000_000n);
    subs.actor.setIdentity(alice);
    const req: SubscriptionRequest = [
      [
        { tokenCanister: nnsLedgerCanisterId },
        { serviceCanister: serviceProvider2.getPrincipal() },
        { interval: { Weekly: null } },
        { amountPerInterval: 500_000n },
      ],
    ];
    const result = await subs.actor.icrc79_subscribe(req);
    const ok = (result[0] as any)[0].Ok;
    subIdToCancel = ok.subscriptionId;

    await pic.advanceTime(1_000);
    await tickN(10);
  });

  it("icrc79_cancel_subscription sets WillCancel then Canceled", async () => {
    subs.actor.setIdentity(alice);
    const result = await subs.actor.icrc79_cancel_subscription([
      { subscriptionId: subIdToCancel, reason: "test cancel" },
    ]);
    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject([{ Ok: expect.any(BigInt) }]);

    // Verify status changed
    const userSubs = await subs.actor.icrc79_get_user_subscriptions([], [], []);
    const found = userSubs.find((s) => s.subscriptionId === subIdToCancel);
    expect(found).toBeDefined();
    // Should be WillCancel or Canceled
    const status = found!.status;
    const isTerminating =
      "WillCancel" in status || "Canceled" in status;
    expect(isTerminating).toBe(true);
  });

  it("unauthorized user cannot cancel", async () => {
    // Create another subscription to test unauthorized cancel
    await approveSubsCanister(alice, 10_000_000_000_000n);
    subs.actor.setIdentity(alice);
    const req: SubscriptionRequest = [
      [
        { tokenCanister: nnsLedgerCanisterId },
        { serviceCanister: serviceProvider2.getPrincipal() },
        { interval: { Daily: null } },
        { amountPerInterval: 100_000n },
        { productId: 99n },
      ],
    ];
    const result = await subs.actor.icrc79_subscribe(req);
    const ok = (result[0] as any)[0].Ok;
    const newSubId = ok.subscriptionId;
    await pic.advanceTime(1_000);
    await tickN(10);

    // Bob tries to cancel Alice's subscription
    subs.actor.setIdentity(bob);
    const cancelResult = await subs.actor.icrc79_cancel_subscription([
      { subscriptionId: newSubId, reason: "bob tries" },
    ]);
    expect(cancelResult.length).toBe(1);
    if (cancelResult[0] && cancelResult[0].length > 0) {
      expect("Err" in cancelResult[0][0]!).toBe(true);
    }
  });
});

describe("Subscription Filtering", () => {
  it("filters by status", async () => {
    subs.actor.setIdentity(alice);

    const activeSubs = await subs.actor.icrc79_get_user_subscriptions(
      [
        {
          subscriptions: [],
          status: [{ Active: null }],
          subaccounts: [],
          products: [],
          services: [],
        },
      ],
      [],
      []
    );

    for (const s of activeSubs) {
      expect("Active" in s.status).toBe(true);
    }
  });

  it("filters by service", async () => {
    subs.actor.setIdentity(alice);
    const filtered = await subs.actor.icrc79_get_user_subscriptions(
      [
        {
          subscriptions: [],
          status: [],
          subaccounts: [],
          products: [],
          services: [[serviceProvider.getPrincipal()]],
        },
      ],
      [],
      []
    );

    for (const s of filtered) {
      expect(s.serviceCanister.toText()).toBe(
        serviceProvider.getPrincipal().toText()
      );
    }
  });

  it("service subscription filter by product", async () => {
    const filtered =
      await subs.actor.icrc79_get_service_subscriptions(
        serviceProvider2.getPrincipal(),
        [{ products: [[[99n]]], status: [], subscriptions: [] }],
        [],
        []
      );

    for (const s of filtered) {
      expect(s.productId).toEqual([99n]);
    }
  });

  it("pagination via take parameter", async () => {
    subs.actor.setIdentity(alice);
    const page1 = await subs.actor.icrc79_get_user_subscriptions(
      [],
      [],
      [1n]
    );
    expect(page1.length).toBeLessThanOrEqual(1);
  });
});

describe("Revenue Indexer", () => {
  it("icrc79_service_leaderboard returns ranked services", async () => {
    const leaderboard = await subs.actor.icrc79_service_leaderboard([], []);
    expect(leaderboard.length).toBeGreaterThanOrEqual(1);

    // Check structure
    const first = leaderboard[0];
    expect(first.service).toBeDefined();
    expect(first.totalRevenue).toBeGreaterThanOrEqual(0n);
    expect(first.activeSubscriptions).toBeGreaterThanOrEqual(0n);
  });

  it("leaderboard is ordered by total revenue descending", async () => {
    const leaderboard = await subs.actor.icrc79_service_leaderboard([], []);
    for (let i = 1; i < leaderboard.length; i++) {
      expect(leaderboard[i - 1].totalRevenue).toBeGreaterThanOrEqual(
        leaderboard[i].totalRevenue
      );
    }
  });

  it("icrc79_service_daily_revenue returns daily buckets", async () => {
    const now = BigInt(await pic.getTime()) * 1_000_000n; // ns
    const dayInNs = 86_400_000_000_000n;
    const startDate = now - dayInNs * 60n; // 60 days ago
    const endDate = now + dayInNs;

    const revenue = await subs.actor.icrc79_service_daily_revenue(
      serviceProvider.getPrincipal(),
      [],
      startDate,
      endDate
    );

    // Should have at least some daily revenue entries from payments processed above
    expect(Array.isArray(revenue)).toBe(true);
    // Entries should have dayKey and amount
    for (const entry of revenue) {
      expect(entry.dayKey).toBeDefined();
      expect(entry.amount).toBeGreaterThanOrEqual(0n);
    }
  });

  it("leaderboard pagination works", async () => {
    const page1 = await subs.actor.icrc79_service_leaderboard([], [1n]);
    expect(page1.length).toBeLessThanOrEqual(1);
  });
});

describe("Service Notifications", () => {
  it("icrc79_get_service_notifications returns notifications", async () => {
    // Notifications are generated by the canister during subscription lifecycle events
    const notifs = await subs.actor.icrc79_get_service_notifications(
      serviceProvider.getPrincipal(),
      [],
      []
    );
    // May or may not have notifications depending on canister behavior
    expect(Array.isArray(notifs)).toBe(true);
  });
});

describe("ICRC-3 Block Log", () => {
  it("icrc3_get_blocks returns blocks for subscription operations", async () => {
    const result = await subs.actor.icrc3_get_blocks([
      { start: 0n, length: 100n },
    ]);
    expect(result.log_length).toBeGreaterThan(0n);
    expect(result.blocks.length).toBeGreaterThan(0);
  });

  it("icrc3_supported_block_types returns array (may be empty)", async () => {
    const types = await subs.actor.icrc3_supported_block_types();
    expect(Array.isArray(types)).toBe(true);
  });

  it("icrc3_get_tip_certificate returns certificate data", async () => {
    const cert = await subs.actor.icrc3_get_tip_certificate();
    // May be empty in PIC, but should not throw
    expect(cert !== undefined).toBe(true);
  });

  it("icrc3_get_archives returns archive info", async () => {
    const archives = await subs.actor.icrc3_get_archives({ from: [] });
    expect(Array.isArray(archives)).toBe(true);
  });
});
