# Subscription Service on DFINITY's Internet Computer

** This is Alpha Software and should not be used in production except for exploratory functionality where you are prepared to lose any and all value of accounts interacting with the system**

Welcome to the Subscription Service built on DFINITY's Internet Computer, adhering to the ICRC-79 standard for secure subscription management. This README file will guide you through understanding, deploying, and using this service effectively.

## Overview

The Subscription Service allows you to manage periodic payment requests on the Internet Computer efficiently and securely, using the ICRC-79 standard. This service is open-source and designed to facilitate a wide array of subscription-based financial transactions, ensuring robustness and flexibility.

## Implementation

This Implementation utilizes Pan Industrial's ICRC79-mo library to implement the ICRC-79 standard. Please see that project for underlying details of how the subscription service works.

## Getting Started

### Candid

The subscription canister has been deployed to canister fe5iu-uiaaa-aaaal-ajxea-cai

You can retrieve the candid and service source files from the Internet Computer Dashboard at https://dashboard.internetcomputer.org/canister/fe5iu-uiaaa-aaaal-ajxea-cai

## Usage

### Subscription Management Workflow

**Subscription Management on DFINITY's Internet Computer**

This document provides a comprehensive guide to managing subscriptions and payments using the **Internet Computer's** ICRC-79 canister standard. The workflow described herein is designed for developers planning to integrate subscription services into their web applications using the DFINITY agent.

### Workflow Overview

1. **Create a Subscription**
2. **Cancel a Subscription**
3. **Pause a Subscription**
4. **Fetch User Subscriptions**
5. **Fetch Payments**

#### 1. Create a Subscription

To create a subscription, your application will need to send a request to the `icrc79_subscribe` method. This method requires various parameters, such as the token canister principal, service canister principal, payment interval, and amount per interval.

**Parameters:**
- **Token Canister:** Principal of the token canister used for payments.
- **Service Canister:** Principal of the service canister.
- **Target Account:** Optional alternative destination for funds
- **Interval:** Frequency of payments (e.g., daily, monthly).
- **Amount per Interval:** Amount to be paid each interval.
- **Broker:** Account of a broker that can obtain a fee(not yet implemented)
- **Base Rate:** (Not yet implemented) Allows the subscription to use a base rate for determining the cost of a subscription at the of the charge. For example: Base Amount of 50, Base Rate of USD, Token Canister of ckBTC will result in a subscription payment of $50 worth of ckBTC.

Subscription requests are an array of possible subscription items. Items should only show up once in the request.

**Request Structure:**
```motoko
  public type SubscriptionRequestItem = {
      #tokenCanister: Principal; // Base token to use to pay the subscription
      #tokenPointer: TokenPointer; // If a multicanister token
      #serviceCanister: Principal; // Service canister to subscribe to
      #interval: Interval; // Interval to pay the subscription
      #amountPerInterval: Nat; // Amount to pay per interval
      #baseRateAsset: (Asset, CheckRate); // Optional: Base rate asset to use to convert the number of tokens to pay. Shoud default to token canister if not specified
      #endDate: Nat; // Optional: Timestamp in nanoseconds to end the subscription
      #targetAccount: Account; //Optional: Account to pay the subscription to, defaults to the service canister default account if not provided
      #productId: Nat; //Optional: Vendor specified product id
      #ICRC17Endpoint: Principal; // Optional KYC validation endpoint
      #firstPayment: Nat; //Optional: set a time for the first regular payment.  If not set, the first payment will be immediate
      #nowPayment: Nat; //Optional. set a token amount to process immediately. requires firstPayment to be set and in the future
      #memo: Blob; //Optional: memo to include with the subscription
      #createAtTime: Nat; //Optional: timestamp for deduplication
      #subaccount: Blob; //Optional: subaccount to use for the subscription
      #broker:Account; //Optional: broker to use for the subscription
  };
```

#### 2. Cancel a Subscription

To cancel an existing subscription, use the `icrc79_cancel_subscription` method. This method requires the subscription ID and an optional reason for the cancellation.

**Parameters:**
- **Subscription ID:** Unique identifier of the subscription.
- **Reason:** Optional reason for cancellation.

**Request Structure:**
```typescript
{
  subscriptionId: Nat,
  reason: Text // e.g., "User requested cancellation"
}
```

#### 3. Pause a Subscription

To pause a subscription, use the `icrc79_pause_subscription` method. This requires the subscription ID, the desired active state (false for pausing), and an optional reason.

**Parameters:**
- **Subscription ID:** Unique identifier of the subscription.
- **Active:** Boolean indicating whether to pause (false) or resume (true).
- **Reason:** Optional reason for pausing.

**Request Structure:**
```typescript
{
  subscriptionId: Nat,
  active: Bool, // e.g., false
  reason: Text // e.g., "User requested to pause"
}
```

#### 4. Fetch User Subscriptions

To retrieve a list of subscriptions associated with a user, use the `icrc79_get_user_subscriptions` method. This method supports optional filters for status, pagination, and other parameters.

**Parameters:**
- **Filter:** Optional filter criteria.
- **Prev:** Optional previous record for pagination.
- **Take:** Optional number of records to fetch.

**Request Structure:**
```typescript
{
  filter: ?{
    status: ?SubStatusFilter, 
    subscriptions: ?[Nat],
    subaccounts: ?[?Blob],
    products: ?[?Nat],
    services: ?[Principal]
  },
  prev: ?Nat, // Optional previous subscription ID for pagination
  take: ?Nat // Optional number of records to fetch
}
```

#### 5. Fetch Payments

To fetch a list of payments related to subscriptions, use the `icrc79_get_user_payments` method.

**Parameters:**
- **Filter:** Optional filters for payment retrieval.
- **Prev:** Optional previous record for pagination.
- **Take:** Optional number of records to fetch.

**Request Structure:**
```typescript
{
  filter: ?{
    status: ?SubStatusFilter, 
    subscriptions: ?[Nat],
    subaccounts: ?[?Blob],
    products: ?[?Nat],
    services: ?[Principal]
  },
  prev: ?Nat, // Optional previous payment ID for pagination
  take: ?Nat // Optional number of records to fetch
}
```

### Integrating with Your Web Application

To integrate these functionalities into your web application, implement the DFINITY agent in your front-end code to make HTTP calls to the respective methods described above. Ensure all principal IDs, intervals, and other parameters are correctly assembled before making the API request.

By incorporating these defined processes, you'll efficiently manage subscriptions and payments on the Internet Computer, leveraging the robust features of ICRC-79. For further granularity and to understand all available parameters and their configurations, refer to the ICRC-79 standard documentation within the `ICRC-79.md` file.

### Logs and Audit

The deployed version contains an implementation of ICRC-3 that records canister operations in a transaction log using the `icrc3_get_blocks` endpoint. The block structure is outlined in the ICRC-79 description.

### Extend and Contribute

We welcome contributions to enhance the service further. Follow these steps to contribute:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them with descriptive messages.
4. Push your changes.
5. Open a pull request.

## Methods Summary

Please refer to the [icrc-79 standard](src/icrc-79.md) for explanations of the functions and their parameters.

Refer to the main code for detailed candid type definitions and method signatures.

## Subscription Fees

The current implementation of the deployed canister splits a subscription into two payments. 98.5% is delivered to the service canister, or optionally the target account, while 1.5% is delivered as a donation to contribute to education, scientific discovery, and the continued development of open source technology for the Internet Computer to account ifoh3-ksock-kdg2i-274hs-z3x7e-irgfv-eyqzv-esrlt-2qywt-jbocu-gae where is managed by ICDevs.org.

Future implementations will implement the ICRC-79 concept of a broker. For subscriptions containing a broker, an additional 1% will be removed from the main subscription amount and delivered to the broker account.

## Canister Controllers.

The canister is currently controlled by the NNS root and my only be upgrade by a NNS Vote.  Upon the finalization of ICRC-79, ICRC-80, and ICRC-72 the canister control will be handed to the NNS for cases when emergency upgrades are required.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## OVS Default Behavior

This motoko class uses libraries that have a default OVS behavior that sends cycles to the developer to provide funding for maintenance and continued development. In accordance with the OVS specification and ICRC85, this behavior may be overridden by another OVS sharing heuristic or turned off. We encourage all users to implement some form of OVS sharing as it helps us provide quality software and support to the community.

Libraries including OVS:
 - icrc79-mo
 - timer-tool