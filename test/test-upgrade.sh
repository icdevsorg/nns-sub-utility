dfx identity use default

dfx canister create subs 

dfx canister install subs --wasm './versions/0_1_0/subsprod.wasm.gz' --argument '(opt record {
  icrc79InitArgs = null;
  icrc3InitArgs = null;
  ttInitArgs = null})'

dfx canister call subs add_token "( principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\";, null})"

dfx identity use test_nns

dfx canister call nns-ledger icrc1_transfer "(record { 
  to = record {owner =principal \"a5oei-rvrhg-x5qx4-whi3a-fwxqy-odwgo-c5jfi-26jx2-fauk5-gmw2u-zqe\"; subaccount=null;};
  fee = opt 10000; 
  memo = null; 
  amount = 100000000000;
  from_subaccount = null;
  created_at_time = null;
})"

dfx canister call nns-ledger icrc1_transfer "(record { 
  to = record {owner =principal \"2xfbh-2kl3t-zjqah-cxkrg-2zq5u-rid2q-sf2i6-bqxs2-2qxri-l5z4b-jae\"; subaccount=null;};
  fee = opt 10000; 
  memo = null; 
  amount = 100000000000;
  from_subaccount = null;
  created_at_time = null;
})"

dfx identity use default

dfx canister call nns-ledger icrc2_approve "(record { 
  spender = record { owner =principal \"bkyz2-fmaaa-aaaaa-qaaaq-cai\"; subaccount=null;};
  expires = null;
  expected_allowance = null;
  fee = opt 10000; 
  memo = null; 
  amount = 100000000000;
  from_subaccount = null;
  created_at_time = null;
})"


dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000001};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 1};
    variant{ serviceCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
  };
})"


dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000002};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 3};
    variant{ serviceCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000003};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 4};
    variant{ serviceCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 1000000056};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 5};
    variant{ serviceCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000004};
    variant{ interval = variant { Daily = null}};
    variant{ serviceCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000004};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 1235};
    variant{ serviceCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
  };
})"


dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000023};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 1};
    variant{ serviceCanister = principal \"bd3sg-teaaa-aaaaa-qaaba-cai\"};
  };
})"


dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000054};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 3};
    variant{ serviceCanister = principal \"bd3sg-teaaa-aaaaa-qaaba-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000065};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 4};
    variant{ serviceCanister = principal \"bd3sg-teaaa-aaaaa-qaaba-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 1000000026};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 5};
    variant{ serviceCanister = principal \"bd3sg-teaaa-aaaaa-qaaba-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000087};
    variant{ interval = variant { Daily = null}};
    variant{ serviceCanister = principal \"bd3sg-teaaa-aaaaa-qaaba-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000094};
    variant{ interval = variant { Daily = null}};
    variant{ productId =2325};
    variant{ serviceCanister = principal \"bd3sg-teaaa-aaaaa-qaaba-cai\"};
  };
})"


dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000123};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 1};
    variant{ serviceCanister = principal \"bkyz2-fmaaa-aaaaa-qaaaq-cai\"};
  };
})"


dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000154};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 3};
    variant{ serviceCanister = principal \"bkyz2-fmaaa-aaaaa-qaaaq-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000165};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 4};
    variant{ serviceCanister = principal \"bkyz2-fmaaa-aaaaa-qaaaq-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 1000000126};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 5};
    variant{ serviceCanister = principal \"bkyz2-fmaaa-aaaaa-qaaaq-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000187};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 3234};
    variant{ serviceCanister = principal \"bkyz2-fmaaa-aaaaa-qaaaq-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000194};
    variant{ interval = variant { Daily = null}};
    variant{ serviceCanister = principal \"bkyz2-fmaaa-aaaaa-qaaaq-cai\"};
  };
})"


dfx identity use bob

dfx canister call nns-ledger icrc2_approve "(record { 
  spender = record { owner =principal \"bkyz2-fmaaa-aaaaa-qaaaq-cai\"; subaccount=null;};
  expires = null;
  expected_allowance = null;
  fee = opt 10000; 
  memo = null; 
  amount = 100000000000;
  from_subaccount = null;
  created_at_time = null;
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000001};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 1};
    variant{ serviceCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
  };
})"


dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000002};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 3};
    variant{ serviceCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000003};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 4};
    variant{ serviceCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 1000000056};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 5};
    variant{ serviceCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000004};
    variant{ interval = variant { Daily = null}};
    variant{ serviceCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000004};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 1235};
    variant{ serviceCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
  };
})"


dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000023};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 1};
    variant{ serviceCanister = principal \"bd3sg-teaaa-aaaaa-qaaba-cai\"};
  };
})"


dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000054};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 3};
    variant{ serviceCanister = principal \"bd3sg-teaaa-aaaaa-qaaba-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000065};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 4};
    variant{ serviceCanister = principal \"bd3sg-teaaa-aaaaa-qaaba-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 1000000026};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 5};
    variant{ serviceCanister = principal \"bd3sg-teaaa-aaaaa-qaaba-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000087};
    variant{ interval = variant { Daily = null}};
    variant{ serviceCanister = principal \"bd3sg-teaaa-aaaaa-qaaba-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000094};
    variant{ interval = variant { Daily = null}};
    variant{ productId =2325};
    variant{ serviceCanister = principal \"bd3sg-teaaa-aaaaa-qaaba-cai\"};
  };
})"


dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000123};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 1};
    variant{ serviceCanister = principal \"bkyz2-fmaaa-aaaaa-qaaaq-cai\"};
  };
})"


dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000154};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 3};
    variant{ serviceCanister = principal \"bkyz2-fmaaa-aaaaa-qaaaq-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000165};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 4};
    variant{ serviceCanister = principal \"bkyz2-fmaaa-aaaaa-qaaaq-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 1000000126};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 5};
    variant{ serviceCanister = principal \"bkyz2-fmaaa-aaaaa-qaaaq-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000187};
    variant{ interval = variant { Daily = null}};
    variant{ productId = 3234};
    variant{ serviceCanister = principal \"bkyz2-fmaaa-aaaaa-qaaaq-cai\"};
  };
})"

dfx canister call subs icrc79_subscribe "( vec {
 vec{
    variant{ tokenCanister = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\"};
    variant{ amountPerInterval = 100000194};
    variant{ interval = variant { Daily = null}};
    variant{ serviceCanister = principal \"bkyz2-fmaaa-aaaaa-qaaaq-cai\"};
  };
})"


dfx canister call subs icrc3_get_blocks "(vec { record{start=0; length=1000;}; })"

dfx canister call subs icrc79_get_service_subscriptions "(principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\", null, null,null)"

dfx identity use default

a5oei-rvrhg-x5qx4-whi3a-fwxqy-odwgo-c5jfi-26jx2-fauk5-gmw2u-zqe

dfx canister call subs icrc79_get_user_payments "(null, null,null)"

dfx canister call subs icrc3_get_tip_certificate

dfx canister call subs icrc3_get_supported_blocks


dfx canister install subs --wasm './.dfx/local/canisters/subs/subs.wasm.gz' --argument '(opt record {
  icrc79InitArgs = null;
  icrc3InitArgs = null;
  ttInitArgs = null})' --mode upgrade
