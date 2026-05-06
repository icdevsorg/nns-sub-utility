import type { Subscription, TokenInfo } from '../canister/subs';

export function buildPaymentTokenLabelBySubscriptionId(
  subscriptions: Array<Pick<Subscription, 'subscriptionId' | 'tokenCanister'>>,
  supportedTokens: Array<Pick<TokenInfo, 'tokenCanister' | 'tokenSymbol'>> | undefined,
): Record<string, string> {
  const symbolByCanister = new Map(
    (supportedTokens ?? []).map((token) => [token.tokenCanister.toText(), token.tokenSymbol]),
  );

  const labels: Record<string, string> = {};
  for (const subscription of subscriptions) {
    const tokenCanister = subscription.tokenCanister.toText();
    labels[subscription.subscriptionId.toString()] = symbolByCanister.get(tokenCanister) ?? tokenCanister;
  }

  return labels;
}