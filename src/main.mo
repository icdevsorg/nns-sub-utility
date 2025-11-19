import Blob "mo:base/Blob";
import Buffer "mo:base/Buffer";
import D "mo:base/Debug";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Timer "mo:base/Timer";
import Principal "mo:base/Principal";
import ICRC3 "mo:icrc3-mo";
import ICRC3Migrations "mo:icrc3-mo/migrations";
import ICRC3Types "mo:icrc3-mo/migrations/types";
import ICRC3Default "initial_state/icrc3";

import Service "mo:icrc79-mo/Service";
import ICRC79 "../../../../PanIndustrial/code/icrc79.mo/src/"; //"mo:icrc79-mo/";
import ICRC79MigrationTypes "../../../../PanIndustrial/code/icrc79.mo/src/migrations/types"; //"mo:icrc79-mo/migrations/types";
import ICRC79Migrations ="../../../../PanIndustrial/code/icrc79.mo/src/migrations"; //"mo:icrc79-mo/migrations";
import TT "mo:timer-tool";
import KnownTokens "../../../../PanIndustrial/code/icrc79.mo/src/knownTokens"; //"mo:icrc79-mo/knownTokens";
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
      D.print("Initializing TimerTool");
      //newClass.initialize<system>();
      //do any work here necessary for initialization
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