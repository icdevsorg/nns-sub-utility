import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useServicePayments } from '../useServicePayments';
import { useServiceSubscriptions } from '../useServiceSubscriptions';

const actorMock = {
  icrc79_get_service_subscriptions: vi.fn(async () => []),
  icrc79_get_service_payments: vi.fn(async () => []),
};

vi.mock('../../canister/subs', () => ({
  getSubsActor: async () => actorMock,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  actorMock.icrc79_get_service_subscriptions.mockClear();
  actorMock.icrc79_get_service_payments.mockClear();
});

describe('service query keys', () => {
  it('handles bigint filters in service subscription query keys', async () => {
    const filter = {
      status: [] as [],
      subscriptions: [[1n, 2n]] as [bigint[]],
      products: [] as [],
    };

    const { result } = renderHook(
      () => useServiceSubscriptions('aaaaa-aa', filter),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(actorMock.icrc79_get_service_subscriptions).toHaveBeenCalledOnce();
  });

  it('handles bigint filters in service payment query keys', async () => {
    const filter = {
      status: [] as [],
      subscriptions: [[1n, 2n]] as [bigint[]],
      products: [] as [],
    };

    const { result } = renderHook(
      () => useServicePayments('aaaaa-aa', filter),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(actorMock.icrc79_get_service_payments).toHaveBeenCalledOnce();
  });
});