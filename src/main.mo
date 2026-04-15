import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Buffer "mo:base/Buffer";
import D "mo:base/Debug";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Order "mo:base/Order";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Timer "mo:base/Timer";
import Principal "mo:base/Principal";
import BTree "mo:stableheapbtreemap/BTree";
import ICRC3 "mo:icrc3-mo";
import ICRC3Migrations "mo:icrc3-mo/migrations";
import ICRC3Types "mo:icrc3-mo/migrations/types";
import ICRC3Default "initial_state/icrc3";

import Service "mo:icrc79-mo/Service";
import ICRC79 "mo:icrc79-mo/";
import ICRC79MigrationTypes "mo:icrc79-mo/migrations/types";
import ICRC79Migrations = "mo:icrc79-mo/migrations";
import TT "mo:timer-tool";
import KnownTokens "mo:icrc79-mo/knownTokens";
import Vector "mo:vector";
import ClassPlus "mo:class-plus";


import CertTree "mo:cert/CertTree";
import Map "mo:map/Map";


shared (deployer) actor class Subs(initArgs: ?{
  icrc79InitArgs: ?ICRC79MigrationTypes.Args;
  icrc3InitArgs : ?ICRC3Types.Args;
  ttInitArgs : ?TT.Args;
}) : async Service.Service = this {

  let debug_channel = {
    announce = true;
  };

  let ttDefaultArgs = null;

  let initManager = ClassPlus.ClassPlusInitializationManager(deployer.caller, Principal.fromActor(this), true);

  stable var icrc3_migration_state = ICRC3.initialState();
  stable var tt_migration_state : TT.State = TT.Migration.migration.initialState;

  stable var blockMap  = Map.new<Principal, Bool>();

  // ───── Revenue Indexer (Phase 0) ─────
  // Per-service index: tracks total revenue, active sub count, and daily revenue buckets
  // Daily revenue is keyed by day number (nanoseconds / NS_PER_DAY) → productId → amount
  let NS_PER_DAY : Nat = 86_400_000_000_000;
  let ROLLING_WINDOW_DAYS : Nat = 365;

  type DailyBucket = Map.Map<Nat, Nat>; // dayKey → total amount for that day+product
  type ProductDailyMap = Map.Map<Nat, DailyBucket>; // productId (0 = no product) → daily buckets

  type ServiceRevenueIndex = {
    var totalRevenue : Nat;
    var activeSubscriptions : Nat;
    dailyRevenue : ProductDailyMap; // productId → (dayKey → amount)
  };

  stable var revenueIndex = Map.new<Principal, ServiceRevenueIndex>();

  stable var certStore : CertTree.Store = CertTree.newStore();

  private func get_certificate_store() : CertTree.Store {
    // D.print("returning cert store " # debug_show(cert_store));
    return certStore;
  };

    //called from a component so signitrue must match.
  private func updated_certification(cert: Blob, lastIndex: Nat) : Bool{

    // D.print("updating the certification " # debug_show(CertifiedData.getCertificate(), ct.treeHash()));
    ct.setCertifiedData();
    // D.print("did the certification " # debug_show(CertifiedData.getCertificate()));
    return true;
  };

  let ct = CertTree.Ops(certStore);


  private func get_icrc3_environment() : ICRC3.Environment{
    {
      updated_certification = ?updated_certification;
      get_certificate_store = ?get_certificate_store;
    };
  };

  

    let icrc3 = ICRC3.Init<system>({
    initialState = icrc3_migration_state;
    args = switch(do?{initArgs!.icrc3InitArgs!}){
        case(null) {
          ICRC3Default.defaultConfig(deployer.caller);
        };
        case(?val) ?val;
      };
    manager= initManager;
    pullEnvironment = ?get_icrc3_environment;
    onInitialize = ?(func(newClass : ICRC3.ICRC3) : async* () {
      D.print("Initializing ICRC3");
      //_icrc3 := ?newClass;
      //ignore Timer.setTimer<system>(#nanoseconds(0), ensure_block_types);
      //do any work here necessary for initialization
    });
    onStorageChange = func(new_state: ICRC3.State) {
      icrc3_migration_state := new_state;
    }
  });


  transient let tt  = TT.Init<system>({
    manager = initManager;
    initialState = tt_migration_state;
    args = null;
    pullEnvironment = ?(func() : TT.Environment {
      {
        advanced = null;
        syncUnsafe = null;
        reportExecution = null;
        reportError = null;
        reportBatch = null
      };
    });
    onInitialize = ?(func (newClass: TT.TimerTool) : async* () {
      D.print("Initializing TimerTool");
      newClass.initialize<system>();
      //do any work here necessary for initialization
    });
    onStorageChange = func(state: TT.State) {
      tt_migration_state := state;
    }
  });



  private var _icrc79 : ?ICRC79.ICRC79 = null;

  private func getICRC79Environment() : ICRC79.Environment {
    return {
      addLedgerTransaction = ?icrc3().add_record;
      canSendFee = ?canSendFee; //todo: set up blockers
      brokerFeeBPS = 3333;
      tt = tt();
      advanced = null;
    };
  };

  private func canSendFee(detail: ICRC79.FeeDetail) : Bool {
    switch(Map.get<Principal, Bool>(blockMap, Map.phash, detail.service)){
      case(null){};
      case(?val) {
        if(val== false){
          return false;
        };
      };
    };
    switch(detail.targetAccount){
      case(null){};
      case(?account){
        switch(Map.get<Principal, Bool>(blockMap, Map.phash, account.owner)){
          case(null){};
          case(?val) {
            if(val== false){
              return false;
            };
          };
        };
      };
    };
    switch(Map.get<Principal, Bool>(blockMap, Map.phash, detail.subscribingAccount.owner)){
      case(null){};
      case(?val) {
        if(val== false){
          return false;
        };
      };
    };

    switch(Map.get<Principal, Bool>(blockMap, Map.phash, detail.feeAccount.owner)){
      case(null){};
      case(?val) {
        if(val== false){
          return false;
        };
      };
    };

    return true;
  };


  stable var icrc79MigrationState : ICRC79MigrationTypes.State = ICRC79.Migration.migration.initialState;

  ///MARK: Revenue Indexer Helpers

  private func getOrCreateServiceIndex(service : Principal) : ServiceRevenueIndex {
    switch(Map.get<Principal, ServiceRevenueIndex>(revenueIndex, Map.phash, service)) {
      case(?idx) idx;
      case(null) {
        let idx : ServiceRevenueIndex = {
          var totalRevenue = 0;
          var activeSubscriptions = 0;
          dailyRevenue = Map.new<Nat, DailyBucket>();
        };
        ignore Map.put<Principal, ServiceRevenueIndex>(revenueIndex, Map.phash, service, idx);
        idx;
      };
    };
  };

  private func nsToDayKey(ns : Nat) : Nat {
    ns / NS_PER_DAY;
  };

  private func pruneOldDays(productMap : ProductDailyMap, currentDayKey : Nat) {
    let cutoff = if (currentDayKey > ROLLING_WINDOW_DAYS) { currentDayKey - ROLLING_WINDOW_DAYS } else { 0 };
    for ((productId, dailyBucket) in Map.entries(productMap)) {
      let toRemove = Buffer.Buffer<Nat>(0);
      for ((dayKey, _amt) in Map.entries(dailyBucket)) {
        if (dayKey < cutoff) {
          toRemove.add(dayKey);
        };
      };
      for (dk in toRemove.vals()) {
        Map.delete<Nat, Nat>(dailyBucket, Map.nhash, dk);
      };
      if (Map.size(dailyBucket) == 0) {
        Map.delete<Nat, DailyBucket>(productMap, Map.nhash, productId);
      };
    };
  };

  private func recordRevenue(service : Principal, productId : ?Nat, amount : Nat, dateNs : Nat) {
    let idx = getOrCreateServiceIndex(service);
    idx.totalRevenue += amount;

    let dayKey = nsToDayKey(dateNs);
    let prodKey = switch(productId) { case(?p) p; case(null) 0; };

    let dailyBucket = switch(Map.get<Nat, DailyBucket>(idx.dailyRevenue, Map.nhash, prodKey)) {
      case(?bucket) bucket;
      case(null) {
        let bucket = Map.new<Nat, Nat>();
        ignore Map.put<Nat, DailyBucket>(idx.dailyRevenue, Map.nhash, prodKey, bucket);
        bucket;
      };
    };

    let existing = switch(Map.get<Nat, Nat>(dailyBucket, Map.nhash, dayKey)) {
      case(?v) v;
      case(null) 0;
    };
    ignore Map.put<Nat, Nat>(dailyBucket, Map.nhash, dayKey, existing + amount);

    pruneOldDays(idx.dailyRevenue, dayKey);
  };

  private func resetRevenueIndex() {
    revenueIndex := Map.new<Principal, ServiceRevenueIndex>();
  };

  private func rebuildRevenueIndex(state : ICRC79MigrationTypes.Current.State) {
    resetRevenueIndex();

    for ((_, subscription) in BTree.entries(state.subscriptions2)) {
      switch (subscription.status) {
        case (#Active) {
          let idx = getOrCreateServiceIndex(subscription.serviceCanister);
          idx.activeSubscriptions += 1;
        };
        case (_) {};
      };
    };

    for ((_, payment) in BTree.entries(state.payments2)) {
      switch (payment.result) {
        case (#Ok) {
          recordRevenue(payment.service, payment.productId, payment.amount, payment.date);
        };
        case (#Err(_)) {};
      };
    };
  };

  ///MARK: Revenue Indexer Listeners

  private func onNewPayment<system>(subscription : ICRC79.SubscriptionState, payment : ICRC79.PaymentRecord, trxId : Nat) : () {
    switch(payment.result) {
      case(#Ok) {
        recordRevenue(subscription.serviceCanister, subscription.productId, payment.amount, payment.date);
      };
      case(#Err(_)) {};
    };
  };

  private func onNewSubscription<system>(subscription : ICRC79.SubscriptionState, trxId : Nat) : () {
    let idx = getOrCreateServiceIndex(subscription.serviceCanister);
    idx.activeSubscriptions += 1;
  };

  private func onCanceledSubscription<system>(subscription : ICRC79.SubscriptionState, trxId : Nat) : () {
    let idx = getOrCreateServiceIndex(subscription.serviceCanister);
    if (idx.activeSubscriptions > 0) {
      idx.activeSubscriptions -= 1;
    };
  };

  private func onPauseSubscription<system>(subscription : ICRC79.SubscriptionState, trxId : Nat) : () {
    let idx = getOrCreateServiceIndex(subscription.serviceCanister);
    if (idx.activeSubscriptions > 0) {
      idx.activeSubscriptions -= 1;
    };
  };

  private func onActivateSubscription<system>(subscription : ICRC79.SubscriptionState, trxId : Nat) : () {
    let idx = getOrCreateServiceIndex(subscription.serviceCanister);
    idx.activeSubscriptions += 1;
  };

  let icrc79 = ICRC79.Init<system>({
    manager = initManager;
    initialState = icrc79MigrationState;
    args = switch(do?{initArgs!.icrc79InitArgs!}){
      case(null) {
        ?{
          publicGoodsAccount = ?{owner = Principal.fromText("agtsn-xyaaa-aaaag-ak3kq-cai"); subaccount = ?Blob.fromArray([39,167,236,212,75,183,197,29,163,240,112,67,54,45,238,71,220,227,55,132,102,170,154,183,149,180,185,26,233,48,38,105]);};
          nextSubscriptionId = null;
          nextPaymentId = null;
          nextNotificationId = null;
          existingSubscriptions = [];
          defaultTake = null;
          feeBPS = null;
          maxUpdates = null;
          maxQueries = null;
          maxTake = null;
          trxWindow = null;
          minDrift = null;
          maxMemoSize = null;
          tokenInfo = ?KnownTokens.knownTokens();
        };
      };
      case(?val) val;
    };
    pullEnvironment = ?(getICRC79Environment);
    onInitialize = ?(func (newClass: ICRC79.ICRC79) : async* () {
      D.print("Initializing ICRC79 + revenue indexer listeners");
      rebuildRevenueIndex(newClass.getState());
      newClass.registerNewPaymentListener("revenue_indexer", onNewPayment);
      newClass.registerNewSubscriptionListener("revenue_indexer", onNewSubscription);
      newClass.registerCanceledSubscriptionListener("revenue_indexer", onCanceledSubscription);
      newClass.registerPauseSubscriptionListener("revenue_indexer", onPauseSubscription);
      newClass.registerActivateSubscriptionListener("revenue_indexer", onActivateSubscription);
    });
    onStorageChange = func(state: ICRC79.State) {
      icrc79MigrationState := state;
    }
  });




  

  

  private var _tt : ?TT.TimerTool = null;

  private func getTTEnvironment() : TT.Environment {
    return {
      advanced = null;
      synUnsafe = null;
      reportExecution = null;
      reportError = null;
      syncUnsafe = null;
      reportBatch = null;
    };
  };

  


  


  ///MARK: Standard Functions
  public shared(msg) func icrc79_subscribe(req: Service.SubscriptionRequest) : async Service.SubscriptionResult {

    D.print("Subs: icrc79_subscribe" # debug_show(req));

    let result = await* icrc79().subscribe<system>(msg.caller, req : Service.SubscriptionRequest, null);
    result;

  };

  public shared(msg) func icrc79_cancel_subscription(req: [{ subscriptionId: Nat; reason: Text }]) : async [Service.CancelResult] {
      // Implementation of cancel subscription logic
      let result = await* icrc79().cancel_subscription<system>(msg.caller, req);
      result;
  };

  public shared(msg) func icrc79_confirm_subscription(confirmRequests: [ICRC79.ConfirmRequests]) : async [Service.ConfirmResult] {
      let result = await* icrc79().checkAllowanceForSubscription<system>(msg.caller, confirmRequests);
      result;
  };

  public shared(msg) func icrc79_pause_subscription(req: ICRC79.PauseRequest) : async [Service.PauseResult] {
      debug if(debug_channel.announce) D.print("Subs: icrc79_pause_subscription" # debug_show(req));
      let result = await* icrc79().pause_subscription<system>(msg.caller, req);
      result;
  };

  public query(msg) func icrc79_get_user_subscriptions(filter: ?ICRC79.UserSubscriptionsFilter, prev: ?Nat, take: ?Nat) : async [Service.Subscription] {
      // Implementation of get user subscriptions logic
      let result = icrc79().get_user_subscriptions(msg.caller, filter, prev, take);
      result;
  };

  public query func icrc79_get_service_subscriptions(service: Principal, filter: ?Service.ServiceSubscriptionFilter, prev: ?Nat, take: ?Nat) : async [Service.Subscription] {
      // Implementation of get service subscriptions logic
      let result = icrc79().get_service_subscriptions(service, filter, prev, take);
      result;
  };

  public query(msg) func icrc79_get_user_payments(filter: ?ICRC79.UserSubscriptionsFilter, prev: ?Nat, take: ?Nat) : async [Service.PaymentRecord] {
      // Implementation of get user payments logic
      debug if(debug_channel.announce) D.print("Subs: icrc79_get_user_payments" # debug_show(filter) # debug_show(prev) # debug_show(take));
      icrc79().get_user_payments(msg.caller, filter, prev, take);
  };

  public query(msg) func icrc79_get_payments_pending(subscriptionIds: [Nat]) : async [?Service.PendingPayment] {
      // Implementation of get user pending payments logic
      debug if(debug_channel.announce) D.print("Subs:     public query func icrc79_payments_pending(subscriptionIds: [Nat]) : async [Service.PendingPayment] {" # debug_show(subscriptionIds));
      icrc79().get_payments_pending(msg.caller, subscriptionIds);
  };

  public query func icrc79_get_service_payments(service: Principal, filter:?ICRC79.ServiceSubscriptionFilter, prev: ?Nat, take: ?Nat) : async [Service.PaymentRecord] {
      // Implementation of get service payments logic
        let result = icrc79().get_service_payments(service, filter, prev, take);
      result;
  };

  public query(msg) func icrc79_get_service_notifications(service: Principal, prev: ?Nat, take: ?Nat) : async [Service.ServiceNotification] {
      // Implementation of get service notifications logic
      let result = icrc79().get_service_notifications(msg.caller, service, prev, take);
      result;
  };

  public query func icrc79_metadata() : async [(Text, Service.Value)] {
      // Implementation of metadata retrieval logic
      [
        ("icrc79:max_query_batch_size", #Nat(icrc79().getState().maxQueries)),
        ("icrc79:max_update_batch_size", #Nat(icrc79().getState().maxUpdates)),
        ("icrc79:default_take_value", #Nat(icrc79().getState().defaultTake)),
        ("icrc79:max_take_value", #Nat(icrc79().getState().maxTake)),
        ("icrc79:max_memo_size", #Nat(icrc79().getState().maxMemoSize)),
        ("icrc79:tx_window", #Nat(icrc79().getState().trxWindow)),
        ("icrc79:permitted_drift", #Nat(icrc79().getState().minDrift)),
      ];
  };

  public query func icrc79_max_query_batch_size() : async Nat {
      // Implementation of max query batch size logic
      icrc79().getState().maxQueries;
  };

  public query func icrc79_max_update_batch_size() : async Nat {
      // Implementation of max update batch size logic
      icrc79().getState().maxUpdates;
  };

  public query func icrc79_default_take_value() : async Nat {
      // Implementation of default take value logic
      icrc79().getState().defaultTake;
  };

  public query func icrc79_max_take_value() : async Nat {
      // Implementation of max take value logic
      icrc79().getState().maxTake;
  };

  public query func icrc79_max_memo_size() : async Nat {
      // Implementation of max memo size logic
      icrc79().getState().maxMemoSize;
  };

  public query func icrc79_tx_window() : async Nat {
      // Implementation of tx window logic
      icrc79().getState().trxWindow; // 24 hours
  };

  public query func icrc79_permitted_drift() : async Nat {
      // Implementation of permitted drift logic
      icrc79().getState().minDrift;//  1 minute
  };

  ///MARK: Revenue Indexer Query Endpoints

  public type LeaderboardEntry = {
    service : Principal;
    totalRevenue : Nat;
    activeSubscriptions : Nat;
  };

  public type DailyRevenueEntry = {
    dayKey : Nat; // day number (nanoseconds / NS_PER_DAY)
    amount : Nat;
  };

  public query func icrc79_service_leaderboard(prev : ?Nat, take : ?Nat) : async [LeaderboardEntry] {
    let maxTake = 100;
    let requestedTake = switch(take) { case(?t) { if (t > maxTake) maxTake else t }; case(null) 20; };
    let startFrom = switch(prev) { case(?p) p; case(null) 0; };

    // Collect all service entries
    let entries = Buffer.Buffer<LeaderboardEntry>(Map.size(revenueIndex));
    for ((service, idx) in Map.entries(revenueIndex)) {
      entries.add({
        service = service;
        totalRevenue = idx.totalRevenue;
        activeSubscriptions = idx.activeSubscriptions;
      });
    };

    // Sort by totalRevenue descending
    entries.sort(func(a : LeaderboardEntry, b : LeaderboardEntry) : Order.Order {
      if (a.totalRevenue > b.totalRevenue) #less  // higher revenue first
      else if (a.totalRevenue < b.totalRevenue) #greater
      else Principal.compare(a.service, b.service);
    });

    // Paginate
    let arr = Buffer.toArray(entries);
    let end = if (startFrom + requestedTake > arr.size()) arr.size() else startFrom + requestedTake;
    if (startFrom >= arr.size()) return [];
    Array.tabulate<LeaderboardEntry>(end - startFrom, func(i : Nat) : LeaderboardEntry {
      arr[startFrom + i];
    });
  };

  public query func icrc79_service_daily_revenue(
    service : Principal,
    productId : ?Nat,
    startDate : Nat, // nanosecond timestamp
    endDate : Nat,   // nanosecond timestamp
  ) : async [DailyRevenueEntry] {
    let startDay = nsToDayKey(startDate);
    let endDay = nsToDayKey(endDate);

    switch(Map.get<Principal, ServiceRevenueIndex>(revenueIndex, Map.phash, service)) {
      case(null) [];
      case(?idx) {
        let prodKey = switch(productId) { case(?p) p; case(null) 0; };
        switch(Map.get<Nat, DailyBucket>(idx.dailyRevenue, Map.nhash, prodKey)) {
          case(null) [];
          case(?dailyBucket) {
            let results = Buffer.Buffer<DailyRevenueEntry>(0);
            for ((dayKey, amount) in Map.entries(dailyBucket)) {
              if (dayKey >= startDay and dayKey <= endDay) {
                results.add({ dayKey = dayKey; amount = amount });
              };
            };
            // Sort by dayKey ascending
            results.sort(func(a : DailyRevenueEntry, b : DailyRevenueEntry) : Order.Order {
              Nat.compare(a.dayKey, b.dayKey);
            });
            Buffer.toArray(results);
          };
        };
      };
    };
  };

    ///MARK: 0.0.1 Functions
  public shared(msg) func icrc79_subscribe_0_0_1(req: Service.SubscriptionRequest) : async Service.SubscriptionResult {

    D.print("Subs: icrc79_subscribe" # debug_show(req));

    let result = await* icrc79().subscribe<system>(msg.caller, req : Service.SubscriptionRequest, null);
    result;

  };

    public shared(msg) func icrc79_cancel_subscription_0_0_1(req: [{ subscriptionId: Nat; reason: Text }]) : async [Service.CancelResult] {
        // Implementation of cancel subscription logic
        let result = await* icrc79().cancel_subscription<system>(msg.caller, req);
        result;
    };

    public shared(msg) func icrc79_confirm_subscription_0_0_1(confirmRequests: [ICRC79.ConfirmRequests]) : async [Service.ConfirmResult] {
        let result = await* icrc79().checkAllowanceForSubscription<system>(msg.caller, confirmRequests);
        result;
    };

    public shared(msg) func icrc79_pause_subscription_0_0_1(req: ICRC79.PauseRequest) : async [Service.PauseResult] {
        debug if(debug_channel.announce) D.print("Subs: icrc79_pause_subscription" # debug_show(req));
        let result = await* icrc79().pause_subscription<system>(msg.caller, req);

        result;
    };

    public query(msg) func icrc79_get_user_subscriptions_0_0_1(filter: ?ICRC79.UserSubscriptionsFilter, prev: ?Nat, take: ?Nat) : async [Service.Subscription] {
        // Implementation of get user subscriptions logic
        let result = icrc79().get_user_subscriptions(msg.caller, filter, prev, take);
        result;
    };

    public query func icrc79_get_service_subscriptions_0_0_1(service: Principal, filter: ?Service.ServiceSubscriptionFilter, prev: ?Nat, take: ?Nat) : async [Service.Subscription] {
        // Implementation of get service subscriptions logic
        let result = icrc79().get_service_subscriptions(service, filter, prev, take);
        result;
    };

    public query(msg) func icrc79_get_user_payments_0_0_1(filter: ?ICRC79.UserSubscriptionsFilter, prev: ?Nat, take: ?Nat) : async [Service.PaymentRecord] {
        // Implementation of get user payments logic
        debug if(debug_channel.announce) D.print("Subs: icrc79_get_user_payments" # debug_show(filter) # debug_show(prev) # debug_show(take));
        icrc79().get_user_payments(msg.caller, filter, prev, take);
    };

    public query(msg) func icrc79_get_payments_pending_0_0_1(subscriptionIds: [Nat]) : async [?Service.PendingPayment] {
        // Implementation of get user pending payments logic
        debug if(debug_channel.announce) D.print("Subs:     public query func icrc79_payments_pending(subscriptionIds: [Nat]) : async [Service.PendingPayment] {" # debug_show(subscriptionIds));
        icrc79().get_payments_pending(msg.caller, subscriptionIds);
    };

    public query func icrc79_get_service_payments_0_0_1(service: Principal, filter:?ICRC79.ServiceSubscriptionFilter, prev: ?Nat, take: ?Nat) : async [Service.PaymentRecord] {
        // Implementation of get service payments logic
         let result = icrc79().get_service_payments(service, filter, prev, take);
        result;
    };



    public query(msg) func icrc79_get_service_notifications_0_0_1(service: Principal, prev: ?Nat, take: ?Nat) : async [Service.ServiceNotification] {
        // Implementation of get service notifications logic
        let result = icrc79().get_service_notifications(msg.caller, service, prev, take);
        result;
    };

    public query func icrc79_metadata_0_0_1() : async [(Text, Service.Value)] {
        // Implementation of metadata retrieval logic
        [
          ("icrc79:max_query_batch_size", #Nat(icrc79().getState().maxQueries)),
          ("icrc79:max_update_batch_size", #Nat(icrc79().getState().maxUpdates)),
          ("icrc79:default_take_value", #Nat(icrc79().getState().defaultTake)),
          ("icrc79:max_take_value", #Nat(icrc79().getState().maxTake)),
          ("icrc79:max_memo_size", #Nat(icrc79().getState().maxMemoSize)),
          ("icrc79:tx_window", #Nat(icrc79().getState().trxWindow)),
          ("icrc79:permitted_drift", #Nat(icrc79().getState().minDrift)),
        ];
    };

    public query func icrc79_max_query_batch_size_0_0_1() : async Nat {
        // Implementation of max query batch size logic
        icrc79().getState().maxQueries;
    };

    public query func icrc79_max_update_batch_size_0_0_1() : async Nat {
        // Implementation of max update batch size logic
        icrc79().getState().maxUpdates;
    };

    public query func icrc79_default_take_value_0_0_1() : async Nat {
        // Implementation of default take value logic
        icrc79().getState().defaultTake;
    };

    public query func icrc79_max_take_value_0_0_1() : async Nat {
        // Implementation of max take value logic
        icrc79().getState().maxTake;
    };

    public query func icrc79_max_memo_size_0_0_1() : async Nat {
        // Implementation of max memo size logic
        icrc79().getState().maxMemoSize;
    };

    public query func icrc79_tx_window_0_0_1() : async Nat {
        // Implementation of tx window logic
        icrc79().getState().trxWindow; // 24 hours
    };

    public query func icrc79_permitted_drift_0_0_1() : async Nat {
        // Implementation of permitted drift logic
        icrc79().getState().minDrift;//  1 minute
    };

    public query func icrc3_get_blocks(args: ICRC3.GetBlocksArgs) : async ICRC3.GetBlocksResult{
      return icrc3().get_blocks(args);
    };

    public query func icrc3_get_archives(args: ICRC3.GetArchivesArgs) : async ICRC3.GetArchivesResult{
      return icrc3().get_archives(args);
    };

    public query func icrc3_get_tip_certificate() : async ?ICRC3.DataCertificate {
      return icrc3().get_tip_certificate();
    };

    public query func icrc3_supported_block_types() : async [ICRC3.BlockType] {
      return icrc3().supported_block_types();
    };

    public query func icrc10_supported_standards() : async [{name: Text; url: Text}] {

    return [
      {name = "ICRC-3"; url = "https://github.com/dfinity/ICRC/ICRCs/ICRC-3"},
      {name = "ICRC-10"; url = "https://github.com/dfinity/ICRC/ICRCs/ICRC-10"},
      {name = "ICRC-79"; url = "https://github.com/dfinity/ICRC/ICRCs/ICRC-79"}];
  };

  ///MARK: Lookups
  public query func get_token_info() : async [ICRC79.TokenInfo] {
    // Implementation of get token info logic
    Iter.toArray<ICRC79.TokenInfo>(Map.vals(icrc79().getState().tokenInfo));
  };

  ///MARK: Admin Functions
  public shared(msg) func add_token(tokenCanister: Principal, tokenPointer: ?Blob) : async ?ICRC79.TokenInfo {
      // Implementation of add token logic
      if (msg.caller != Principal.fromText("mctz3-uvscw-rbtha-zdzis-q46vd-vzbza-bxjk5-mleuf-jml6g-s2hq3-vqe")) { //icdev manager
          return null;
      };
      await* icrc79().addTokenInfo(tokenCanister, tokenPointer);
  };

  ///MARK: Admin Functions
  public shared(msg) func add_blocked_service(principal: Principal, bBlock: Bool) : async () {
      // Implementation of add token logic
      if (msg.caller != Principal.fromText("mctz3-uvscw-rbtha-zdzis-q46vd-vzbza-bxjk5-mleuf-jml6g-s2hq3-vqe")) { //icdev manager
          return;
      };

      ignore Map.put<Principal, Bool>(blockMap, Map.phash, principal, bBlock);
  };



  system func postupgrade() : () {
    ignore tt();
    ignore icrc3();
    ignore icrc79();

    return;
  };



  

};