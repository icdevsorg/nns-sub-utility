/**
 * Centralized configuration.
 * Canister IDs are hardcoded for production.
 * IC host supports env var override for local dev.
 */
export const CONFIG = {
  SUBS_CANISTER_ID: import.meta.env.VITE_SUBS_CANISTER_ID ?? 'hl3xq-uiaaa-aaaar-qbxqa-cai',
  IC_HOST: import.meta.env.VITE_IC_HOST ?? 'https://icp-api.io',
  II_URL: import.meta.env.VITE_II_URL ?? 'https://identity.ic0.app',
  REFETCH_INTERVAL: 30_000,
  STALE_TIME: 10_000,
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  RECENT_BLOCKS_COUNT: 10,
  TRANSACTIONS_PAGE_SIZE: 25,
} as const;
