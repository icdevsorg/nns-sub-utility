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
import ICRC79 "mo:icrc79-mo/";
import ICRC79MigrationTypes "mo:icrc79-mo/migrations/types";
import ICRC79Migrations "mo:icrc79-mo/migrations";
import TT "mo:timer-tool";
import KnownTokens "mo:icrc79-mo/knownTokens";
import Vector "mo:vector";


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


  stable var icrc79MigrationState : ICRC79MigrationTypes.State = #v0_0_0(#data);
  stable var icrc3MigrationState : ICRC3Types.State = #v0_0_0(#data);
  stable var ttMigrationState : TT.State = #v0_0_0(#data);

  stable var blockMap  = Map.new<Principal, Bool>();

  icrc79MigrationState := ICRC79Migrations.migrate(
    icrc79MigrationState, 
    #v0_2_0(#id), 
    switch(do?{initArgs!.icrc79InitArgs!}){
      case(null) {
        ?{
          publicGoodsAccount = ?{owner = Principal.fromText("agtsn-xyaaa-aaaag-ak3kq-cai");
          subaccount = ?Blob.fromArray([39,167,236,212,75,183,197,29,163,240,112,67,54,45,238,71,220,227,55,132,102,170,154,183,149,180,185,26,233,48,38,105]);};//org.icdevs.subscription.collector;
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
          tokenInfo = ?KnownTokens.knownTokens()
        };
      };
      case(?val) val;
    }, 
    deployer.caller);

    icrc3MigrationState := ICRC3Migrations.migrate(
      icrc3MigrationState, 
      #v0_1_0(#id), 
      switch(do?{initArgs!.icrc3InitArgs!}){
        case(null) {
          ICRC3Default.defaultConfig(deployer.caller);
        };
        case(?val) val;
      }, 
      deployer.caller);

  ttMigrationState :=  TT.init(TT.initialState(),#v0_1_0(#id), switch(do?{initArgs!.ttInitArgs!}){
      case(null) null;
      case(?val) val;
    }, deployer.caller);

  let #v0_2_0(#data(currentICRC79State)) = icrc79MigrationState;
  let #v0_1_0(#data(currentICRC3State)) = icrc3MigrationState;
  let #v0_1_0(#data(currentTTState)) = ttMigrationState;

  private var _icrc79 : ?ICRC79.ICRC79 = null;

  private func getICRC79Environment<system>() : ICRC79.Environment {
    return {
      addLedgerTransaction = ?icrc3().add_record;
      canSendFee = ?canSendFee; //todo: set up blockers
      tt = tt<system>();
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

  private func icrc79<system>() : ICRC79.ICRC79 {
    switch(_icrc79) {
      case(?icrc79) return icrc79;
      case(null) {
        let icrc79 = ICRC79.ICRC79(?icrc79MigrationState, Principal.fromActor(this), getICRC79Environment<system>() );
        _icrc79 := ?icrc79;
        return icrc79;
      };
    };  
  };

  func q_icrc79() : ICRC79.ICRC79 {
   let ?found = _icrc79 else D.trap("ICRC79 not initialized");
   found;
  };

  private var _icrc3 : ?ICRC3.ICRC3 = null;

  private func getICRC3Environment() : ICRC3.Environment {
    ?{
      updated_certification = ?updated_certification;
      get_certificate_store = ?get_certificate_store;
    };
  };

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


  private func icrc3() : ICRC3.ICRC3 {
    switch(_icrc3) {
      case(?icrc3) return icrc3;
      case(null) {
        let icrc3 = ICRC3.ICRC3(?icrc3MigrationState, Principal.fromActor(this), getICRC3Environment() );
        _icrc3 := ?icrc3;
        return icrc3;
      };
    };  
  };

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

  private func tt<system>() : TT.TimerTool {
    switch(_tt) {
      case(?tt) return tt;
      case(null) {
        let x = TT.TimerTool(?ttMigrationState, Principal.fromActor(this), getTTEnvironment());
        x.initialize<system>();
        _tt := ?x;
        x;
      };
    };  
  };


  ///MARK: Standard Functions
  public shared(msg) func icrc79_subscribe(req: Service.SubscriptionRequest) : async Service.SubscriptionResult {

    D.print("Subs: icrc79_subscribe" # debug_show(req));

    let result = await* icrc79<system>().subscribe<system>(msg.caller, req : Service.SubscriptionRequest, null);
    result;

  };

  public shared(msg) func icrc79_cancel_subscription(req: [{ subscriptionId: Nat; reason: Text }]) : async [Service.CancelResult] {
      // Implementation of cancel subscription logic
      let result = await* icrc79<system>().cancel_subscription<system>(msg.caller, req);
      result;
  };

  public shared(msg) func icrc79_confirm_subscription(confirmRequests: [ICRC79.ConfirmRequests]) : async [Service.ConfirmResult] {
      let result = await* icrc79<system>().checkAllowanceForSubscription<system>(msg.caller, confirmRequests);
      result;
  };

  public shared(msg) func icrc79_pause_subscription(req: ICRC79.PauseRequest) : async [Service.PauseResult] {
      debug if(debug_channel.announce) D.print("Subs: icrc79_pause_subscription" # debug_show(req));
      let result = await* icrc79<system>().pause_subscription<system>(msg.caller, req);
      result;
  };

  public query(msg) func icrc79_get_user_subscriptions(filter: ?ICRC79.UserSubscriptionsFilter, prev: ?Nat, take: ?Nat) : async [Service.Subscription] {
      // Implementation of get user subscriptions logic
      let result = q_icrc79().get_user_subscriptions(msg.caller, filter, prev, take);
      result;
  };

  public query func icrc79_get_service_subscriptions(service: Principal, filter: ?Service.ServiceSubscriptionFilter, prev: ?Nat, take: ?Nat) : async [Service.Subscription] {
      // Implementation of get service subscriptions logic
      let result = q_icrc79().get_service_subscriptions(service, filter, prev, take);
      result;
  };

  public query(msg) func icrc79_get_user_payments(filter: ?ICRC79.UserSubscriptionsFilter, prev: ?Nat, take: ?Nat) : async [Service.PaymentRecord] {
      // Implementation of get user payments logic
      debug if(debug_channel.announce) D.print("Subs: icrc79_get_user_payments" # debug_show(filter) # debug_show(prev) # debug_show(take));
      q_icrc79().get_user_payments(msg.caller, filter, prev, take);
  };

  public query(msg) func icrc79_get_payments_pending(subscriptionIds: [Nat]) : async [?Service.PendingPayment] {
      // Implementation of get user pending payments logic
      debug if(debug_channel.announce) D.print("Subs:     public query func icrc79_payments_pending(subscriptionIds: [Nat]) : async [Service.PendingPayment] {" # debug_show(subscriptionIds));
      q_icrc79().get_payments_pending(msg.caller, subscriptionIds);
  };

  public query func icrc79_get_service_payments(service: Principal, filter:?ICRC79.ServiceSubscriptionFilter, prev: ?Nat, take: ?Nat) : async [Service.PaymentRecord] {
      // Implementation of get service payments logic
        let result = q_icrc79().get_service_payments(service, filter, prev, take);
      result;
  };

  public query(msg) func icrc79_get_service_notifications(service: Principal, prev: ?Nat, take: ?Nat) : async [Service.ServiceNotification] {
      // Implementation of get service notifications logic
      let result = q_icrc79().get_service_notifications(msg.caller, service, prev, take);
      result;
  };

  public query func icrc79_metadata() : async [(Text, Service.Value)] {
      // Implementation of metadata retrieval logic
      [
        ("icrc79:max_query_batch_size", #Nat(q_icrc79().getState().maxQueries)),
        ("icrc79:max_update_batch_size", #Nat(q_icrc79().getState().maxUpdates)),
        ("icrc79:default_take_value", #Nat(q_icrc79().getState().defaultTake)),
        ("icrc79:max_take_value", #Nat(q_icrc79().getState().maxTake)),
        ("icrc79:max_memo_size", #Nat(q_icrc79().getState().maxMemoSize)),
        ("icrc79:tx_window", #Nat(q_icrc79().getState().trxWindow)),
        ("icrc79:permitted_drift", #Nat(q_icrc79().getState().minDrift)),
      ];
  };

  public query func icrc79_max_query_batch_size() : async Nat {
      // Implementation of max query batch size logic
      q_icrc79().getState().maxQueries;
  };

  public query func icrc79_max_update_batch_size() : async Nat {
      // Implementation of max update batch size logic
      q_icrc79().getState().maxUpdates;
  };

  public query func icrc79_default_take_value() : async Nat {
      // Implementation of default take value logic
      q_icrc79().getState().defaultTake;
  };

  public query func icrc79_max_take_value() : async Nat {
      // Implementation of max take value logic
      q_icrc79().getState().maxTake;
  };

  public query func icrc79_max_memo_size() : async Nat {
      // Implementation of max memo size logic
      q_icrc79().getState().maxMemoSize;
  };

  public query func icrc79_tx_window() : async Nat {
      // Implementation of tx window logic
      q_icrc79().getState().trxWindow; // 24 hours
  };

  public query func icrc79_permitted_drift() : async Nat {
      // Implementation of permitted drift logic
      q_icrc79().getState().minDrift;//  1 minute
  };

    ///MARK: 0.0.1 Functions
  public shared(msg) func icrc79_subscribe_0_0_1(req: Service.SubscriptionRequest) : async Service.SubscriptionResult {

    D.print("Subs: icrc79_subscribe" # debug_show(req));

    let result = await* icrc79<system>().subscribe<system>(msg.caller, req : Service.SubscriptionRequest, null);
    result;

  };

    public shared(msg) func icrc79_cancel_subscription_0_0_1(req: [{ subscriptionId: Nat; reason: Text }]) : async [Service.CancelResult] {
        // Implementation of cancel subscription logic
        let result = await* icrc79<system>().cancel_subscription<system>(msg.caller, req);
        result;
    };

    public shared(msg) func icrc79_confirm_subscription_0_0_1(confirmRequests: [ICRC79.ConfirmRequests]) : async [Service.ConfirmResult] {
        let result = await* icrc79<system>().checkAllowanceForSubscription<system>(msg.caller, confirmRequests);
        result;
    };

    public shared(msg) func icrc79_pause_subscription_0_0_1(req: ICRC79.PauseRequest) : async [Service.PauseResult] {
        debug if(debug_channel.announce) D.print("Subs: icrc79_pause_subscription" # debug_show(req));
        let result = await* icrc79<system>().pause_subscription<system>(msg.caller, req);

        result;
    };

    public query(msg) func icrc79_get_user_subscriptions_0_0_1(filter: ?ICRC79.UserSubscriptionsFilter, prev: ?Nat, take: ?Nat) : async [Service.Subscription] {
        // Implementation of get user subscriptions logic
        let result = q_icrc79().get_user_subscriptions(msg.caller, filter, prev, take);
        result;
    };

    public query func icrc79_get_service_subscriptions_0_0_1(service: Principal, filter: ?Service.ServiceSubscriptionFilter, prev: ?Nat, take: ?Nat) : async [Service.Subscription] {
        // Implementation of get service subscriptions logic
        let result = q_icrc79().get_service_subscriptions(service, filter, prev, take);
        result;
    };

    public query(msg) func icrc79_get_user_payments_0_0_1(filter: ?ICRC79.UserSubscriptionsFilter, prev: ?Nat, take: ?Nat) : async [Service.PaymentRecord] {
        // Implementation of get user payments logic
        debug if(debug_channel.announce) D.print("Subs: icrc79_get_user_payments" # debug_show(filter) # debug_show(prev) # debug_show(take));
        q_icrc79().get_user_payments(msg.caller, filter, prev, take);
    };

    public query(msg) func icrc79_get_payments_pending_0_0_1(subscriptionIds: [Nat]) : async [?Service.PendingPayment] {
        // Implementation of get user pending payments logic
        debug if(debug_channel.announce) D.print("Subs:     public query func icrc79_payments_pending(subscriptionIds: [Nat]) : async [Service.PendingPayment] {" # debug_show(subscriptionIds));
        q_icrc79().get_payments_pending(msg.caller, subscriptionIds);
    };

    public query func icrc79_get_service_payments_0_0_1(service: Principal, filter:?ICRC79.ServiceSubscriptionFilter, prev: ?Nat, take: ?Nat) : async [Service.PaymentRecord] {
        // Implementation of get service payments logic
         let result = q_icrc79().get_service_payments(service, filter, prev, take);
        result;
    };



    public query(msg) func icrc79_get_service_notifications_0_0_1(service: Principal, prev: ?Nat, take: ?Nat) : async [Service.ServiceNotification] {
        // Implementation of get service notifications logic
        let result = q_icrc79().get_service_notifications(msg.caller, service, prev, take);
        result;
    };

    public query func icrc79_metadata_0_0_1() : async [(Text, Service.Value)] {
        // Implementation of metadata retrieval logic
        [
          ("icrc79:max_query_batch_size", #Nat(q_icrc79().getState().maxQueries)),
          ("icrc79:max_update_batch_size", #Nat(q_icrc79().getState().maxUpdates)),
          ("icrc79:default_take_value", #Nat(q_icrc79().getState().defaultTake)),
          ("icrc79:max_take_value", #Nat(q_icrc79().getState().maxTake)),
          ("icrc79:max_memo_size", #Nat(q_icrc79().getState().maxMemoSize)),
          ("icrc79:tx_window", #Nat(q_icrc79().getState().trxWindow)),
          ("icrc79:permitted_drift", #Nat(q_icrc79().getState().minDrift)),
        ];
    };

    public query func icrc79_max_query_batch_size_0_0_1() : async Nat {
        // Implementation of max query batch size logic
        q_icrc79().getState().maxQueries;
    };

    public query func icrc79_max_update_batch_size_0_0_1() : async Nat {
        // Implementation of max update batch size logic
        q_icrc79().getState().maxUpdates;
    };

    public query func icrc79_default_take_value_0_0_1() : async Nat {
        // Implementation of default take value logic
        q_icrc79().getState().defaultTake;
    };

    public query func icrc79_max_take_value_0_0_1() : async Nat {
        // Implementation of max take value logic
        q_icrc79().getState().maxTake;
    };

    public query func icrc79_max_memo_size_0_0_1() : async Nat {
        // Implementation of max memo size logic
        q_icrc79().getState().maxMemoSize;
    };

    public query func icrc79_tx_window_0_0_1() : async Nat {
        // Implementation of tx window logic
        q_icrc79().getState().trxWindow; // 24 hours
    };

    public query func icrc79_permitted_drift_0_0_1() : async Nat {
        // Implementation of permitted drift logic
        q_icrc79().getState().minDrift;//  1 minute
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
    Iter.toArray<ICRC79.TokenInfo>(Map.vals(q_icrc79().getState().tokenInfo));
  };

  ///MARK: Admin Functions
  public shared(msg) func add_token(tokenCanister: Principal, tokenPointer: ?Blob) : async ?ICRC79.TokenInfo {
      // Implementation of add token logic
      if (msg.caller != Principal.fromText("mctz3-uvscw-rbtha-zdzis-q46vd-vzbza-bxjk5-mleuf-jml6g-s2hq3-vqe")) { //icdev manager
          return null;
      };
      await* icrc79<system>().addTokenInfo(tokenCanister, tokenPointer);
  };

  ///MARK: Admin Functions
  public shared(msg) func add_blocked_service(principal: Principal, bBlock: Bool) : async () {
      // Implementation of add token logic
      if (msg.caller != Principal.fromText("mctz3-uvscw-rbtha-zdzis-q46vd-vzbza-bxjk5-mleuf-jml6g-s2hq3-vqe")) { //icdev manager
          return;
      };

      ignore Map.put<Principal, Bool>(blockMap, Map.phash, principal, bBlock);
  };

  ///MARK: Init
  public shared(msg) func init() : async() {
    if(Principal.fromActor(this) != msg.caller){
      D.trap("Only the canister can initialize the canister");
    };
    
    ignore tt<system>();
    ignore icrc3();
    ignore icrc79<system>();
  };

  system func postupgrade() : () {
    ignore tt<system>();
    ignore icrc3();
    ignore icrc79<system>();

    //migrate the icrc3 logs
    var icrc3MigrationState_new : ICRC3Types.State = #v0_0_0(#data);

    var bSafety = false;

    icrc3MigrationState_new := ICRC3Migrations.migrate(
      icrc3MigrationState_new, 
      #v0_1_0(#id), 
      switch(do?{initArgs!.icrc3InitArgs!}){
        case(null) {
          ICRC3Default.defaultConfig(deployer.caller);
        };
        case(?val) val;
      }, 
      deployer.caller);

    let #v0_1_0(#data(newICRC3State)) = icrc3MigrationState_new;

    let newicrc3 = ICRC3.ICRC3(?icrc3MigrationState_new, Principal.fromActor(this), getICRC3Environment() );

    let oldBuffer = Vector.toArray(icrc3().get_state().ledger);

    D.print("processing blocks old size" # debug_show(oldBuffer.size()));

    label proc for(thisBlock in oldBuffer.vals()){
        let #Map(contents) = thisBlock else continue proc;

        let ?#Map(tx) = ICRC3.helper.get_item_from_map("tx",thisBlock) else{
          //shouldn't be here
          continue proc;
        };

        let newTXBuffer = Buffer.Buffer<(Text, ICRC3.Value)>(tx.size());

        for(thisItem in tx.vals()){
          if(thisItem.0 == "prductId"){
            bSafety := true;
            D.print("found product" # debug_show(thisItem.1));
            newTXBuffer.add("productId", thisItem.1);
          } else {
            newTXBuffer.add(thisItem);
          };
        };

        let newTop = Buffer.Buffer<(Text, ICRC3.Value)>(contents.size());

        for(thisItem in contents.vals()){
          if(thisItem.0 == "tx"){
            
          } else {
            newTop.add(thisItem);
          };
        };

        
        ignore newicrc3.add_record<system>(#Map(Buffer.toArray(newTXBuffer)),?#Map(Buffer.toArray(newTop)));
    };

    if(bSafety == true){ //should only hit if we find corrupt blocks
      icrc3().get_state().ledger := newicrc3.get_state().ledger;
      icrc3().get_state().latest_hash := newicrc3.get_state().latest_hash;
      
    
      let supportedBlocks = Buffer.fromIter<ICRC3.BlockType>(icrc3().supported_block_types().vals());

      let blockequal = func(a : {block_type: Text}, b : {block_type: Text}) : Bool {
        a.block_type == b.block_type;
      };

      if(Buffer.indexOf<ICRC3.BlockType>({block_type = "79subCreate"; url="";}, supportedBlocks, blockequal) == null){
        supportedBlocks.add({
              block_type = "79subCreate"; 
              url="https://github.com/dfinity/ICRC/tree/main/standards/ICRC-79";
            });
      };

      if(Buffer.indexOf<ICRC3.BlockType>({block_type = "79subCancel"; url="";}, supportedBlocks, blockequal) == null){
        supportedBlocks.add({
              block_type = "79subCancel"; 
              url="https://github.com/dfinity/ICRC/tree/main/standards/ICRC-79";
            });
      };

      if(Buffer.indexOf<ICRC3.BlockType>({block_type = "79subStatus"; url="";}, supportedBlocks, blockequal) == null){
        supportedBlocks.add({
              block_type = "79subStatus"; 
              url="https://github.com/dfinity/ICRC/tree/main/standards/ICRC-79";
            });
      };

      if(Buffer.indexOf<ICRC3.BlockType>({block_type = "79subNote"; url="";}, supportedBlocks, blockequal) == null){
        supportedBlocks.add({
              block_type = "79subNote"; 
              url="https://github.com/dfinity/ICRC/tree/main/standards/ICRC-79";
            });
      };

      icrc3().update_supported_blocks(Buffer.toArray(supportedBlocks));
    

  
      switch( newicrc3.get_state().latest_hash){
        case(null){};
        case(?val){
          ignore updated_certification(val,  newicrc3.get_state().lastIndex);
        };
      };

    };
    return;
  };


  Timer.setTimer<system>(#nanoseconds(0), func () : async() {
    let selfActor : actor {
      init : shared () -> async ();
    } = actor(Principal.toText(Principal.fromActor(this)));
    await selfActor.init();
  });

  

};