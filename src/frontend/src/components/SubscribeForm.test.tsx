import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Principal } from '@dfinity/principal';
import { SubscribeForm } from './SubscribeForm';

const tokenInfoMock = { data: undefined as any };
const allowanceMock = { data: { allowance: 0n, expires_at: [] }, refetch: vi.fn() };
const approveMutationMock = { mutateAsync: vi.fn() };
const subscribeMutationMock = { mutateAsync: vi.fn() };

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ principal: null }),
}));

vi.mock('../hooks/useTokenInfo', () => ({
  useTokenInfo: () => tokenInfoMock,
}));

vi.mock('../hooks/useTokenMetadata', () => ({
  useTokenMetadata: () => ({ data: null }),
}));

vi.mock('../hooks/useAllowance', () => ({
  useAllowance: () => allowanceMock,
}));

vi.mock('../hooks/useApproveToken', () => ({
  useApproveToken: () => approveMutationMock,
}));

vi.mock('../hooks/useSubscribe', () => ({
  useSubscribe: () => subscribeMutationMock,
}));

vi.mock('./TokenDisplay', () => ({
  TokenDisplay: () => <div>token display</div>,
}));

vi.mock('./LoadingSpinner', () => ({
  LoadingSpinner: () => <div>loading</div>,
}));

describe('SubscribeForm', () => {
  beforeEach(() => {
    allowanceMock.data = { allowance: 0n, expires_at: [] };
    allowanceMock.refetch.mockReset();
    allowanceMock.refetch.mockResolvedValue(undefined);
    approveMutationMock.mutateAsync.mockReset();
    subscribeMutationMock.mutateAsync.mockReset();
    tokenInfoMock.data = [
      {
        tokenCanister: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
        tokenSymbol: 'ICP',
        tokenDecimals: 8,
        tokenFee: [10_000n],
        standards: ['ICRC-1', 'ICRC-2'],
      },
    ];
  });

  it('clears unsupported default tokens and keeps only supported dropdown options', async () => {
    render(
      <SubscribeForm
        defaults={{
          token: 'agtsn-xyaaa-aaaag-ak3kq-cai',
          service: 'aaaaa-aa',
          amount: '1',
          interval: 'Monthly',
        }}
      />,
    );

    const select = screen.getByLabelText('Token Canister') as HTMLSelectElement;

    await waitFor(() => {
      expect(select.value).toBe('');
    });

    expect(screen.queryByRole('option', { name: /agtsn-xyaaa-aaaag-ak3kq-cai/i })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: /ICP \(ryjl3-tyaaa-aaaaa-aaaba-cai\)/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve & Subscribe' })).toBeDisabled();
  });

  it('continues to subscribe when approval returns Duplicate', async () => {
    approveMutationMock.mutateAsync.mockResolvedValue({
      Err: { Duplicate: { duplicate_of: 123n } },
    });
    subscribeMutationMock.mutateAsync.mockResolvedValue([
      [{ Ok: { subscriptionId: 1n, transactionId: 2n } }],
    ]);

    render(
      <SubscribeForm
        defaults={{
          token: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
          service: 'aaaaa-aa',
          amount: '1',
          interval: 'Monthly',
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Approve & Subscribe' }));

    await waitFor(() => {
      expect(allowanceMock.refetch).toHaveBeenCalled();
      expect(subscribeMutationMock.mutateAsync).toHaveBeenCalled();
    });

    expect(screen.queryByText('Approval failed: Duplicate')).not.toBeInTheDocument();
    expect(screen.getByText('Subscription Created!')).toBeInTheDocument();
  });
});