import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SubscriptionDetail } from '../SubscriptionDetail';
import { Principal } from '@dfinity/principal';

// ------- auth mock -------
const authMock = {
  isAuthenticated: true,
  identity: { getPrincipal: () => Principal.fromText('aaaaa-aa') } as any,
  principal: 'aaaaa-aa',
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
};
vi.mock('../../auth/AuthProvider', () => ({
  useAuth: () => authMock,
}));

// ------- hook mocks -------
const detailMock = { data: undefined as any, isPending: false, isError: false };
const paymentsMock = { data: undefined as any, isPending: false };
const cancelMock = { mutate: vi.fn(), isPending: false };
const pauseMock = { mutate: vi.fn(), isPending: false };
const tokenMock = { data: undefined as any };

vi.mock('../../hooks/useSubscriptionDetail', () => ({
  useSubscriptionDetail: () => detailMock,
}));
vi.mock('../../hooks/useUserPayments', () => ({
  useUserPayments: () => paymentsMock,
}));
vi.mock('../../hooks/useCancelSubscription', () => ({
  useCancelSubscription: () => cancelMock,
}));
vi.mock('../../hooks/usePauseSubscription', () => ({
  usePauseSubscription: () => pauseMock,
}));
vi.mock('../../hooks/useTokenInfo', () => ({
  useTokenInfo: () => tokenMock,
}));

function mockSub(overrides: Record<string, unknown> = {}) {
  return {
    subscriptionId: 42n,
    serviceCanister: Principal.fromText('aaaaa-aa'),
    tokenCanister: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
    amountPerInterval: 200_000_000n,
    interval: { Weekly: null },
    status: { Active: null },
    productId: [],
    account: { owner: Principal.fromText('aaaaa-aa'), subaccount: [] },
    baseRateAsset: [],
    brokerId: [],
    endDate: [],
    targetAccount: [],
    memo: [],
    createdAt: 0n,
    ...overrides,
  };
}

function resetMocks() {
  detailMock.data = undefined;
  detailMock.isPending = false;
  detailMock.isError = false;
  paymentsMock.data = undefined;
  paymentsMock.isPending = false;
  cancelMock.mutate.mockClear();
  cancelMock.isPending = false;
  pauseMock.mutate.mockClear();
  pauseMock.isPending = false;
  tokenMock.data = [
    {
      tokenCanister: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
      tokenSymbol: 'ICP',
    },
  ];
  authMock.isAuthenticated = true;
  authMock.isLoading = false;
}

beforeEach(resetMocks);

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/subscriptions/42']}>
      <Routes>
        <Route path="/subscriptions/:id" element={<SubscriptionDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SubscriptionDetail', () => {
  it('shows auth-required when not authenticated', () => {
    authMock.isAuthenticated = false;
    renderPage();
    expect(screen.queryByText(/Subscription #/)).not.toBeInTheDocument();
  });

  it('shows loading spinner when pending', () => {
    detailMock.isPending = true;
    const { container } = renderPage();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error when subscription not found', () => {
    detailMock.isError = true;
    renderPage();
    expect(screen.getByText(/not found|failed to load/i)).toBeInTheDocument();
  });

  it('renders subscription heading with ID', () => {
    detailMock.data = { subscription: mockSub(), pending: null };
    paymentsMock.data = [];
    renderPage();
    expect(screen.getByText('Subscription #42')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    detailMock.data = { subscription: mockSub(), pending: null };
    paymentsMock.data = [];
    renderPage();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders detail fields', () => {
    detailMock.data = { subscription: mockSub(), pending: null };
    paymentsMock.data = [];
    renderPage();
    expect(screen.getByText('Service Canister')).toBeInTheDocument();
    expect(screen.getByText('Token Canister')).toBeInTheDocument();
    expect(screen.getByText('Amount per Interval')).toBeInTheDocument();
    expect(screen.getByText('Interval')).toBeInTheDocument();
  });

  it('renders interval label', () => {
    detailMock.data = { subscription: mockSub(), pending: null };
    paymentsMock.data = [];
    renderPage();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
  });

  it('shows action buttons for active subscription', () => {
    detailMock.data = { subscription: mockSub(), pending: null };
    paymentsMock.data = [];
    renderPage();
    expect(screen.getByText('Pause Subscription')).toBeInTheDocument();
    expect(screen.getByText('Cancel Subscription')).toBeInTheDocument();
  });

  it('shows Resume button for paused subscription', () => {
    detailMock.data = {
      subscription: mockSub({ status: { Paused: null } }),
      pending: null,
    };
    paymentsMock.data = [];
    renderPage();
    expect(screen.getByText('Resume Subscription')).toBeInTheDocument();
    expect(screen.getByText('Cancel Subscription')).toBeInTheDocument();
  });

  it('hides action buttons for cancelled subscription', () => {
    detailMock.data = {
      subscription: mockSub({ status: { Canceled: null } }),
      pending: null,
    };
    paymentsMock.data = [];
    renderPage();
    expect(screen.queryByText('Pause Subscription')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel Subscription')).not.toBeInTheDocument();
  });

  it('renders next payment info when pending exists', () => {
    detailMock.data = {
      subscription: mockSub(),
      pending: {
        nextPaymentDate: [BigInt(Date.now()) * 1_000_000n],
        nextPaymentAmount: [100_000_000n],
      },
    };
    paymentsMock.data = [];
    renderPage();
    expect(screen.getByText('Next Payment')).toBeInTheDocument();
  });

  it('renders payment history section', () => {
    detailMock.data = { subscription: mockSub(), pending: null };
    paymentsMock.data = [];
    renderPage();
    expect(screen.getByText('Payment History')).toBeInTheDocument();
  });

  it('shows the payment token symbol for subscription payments', () => {
    detailMock.data = { subscription: mockSub(), pending: null };
    paymentsMock.data = [
      {
        paymentId: 1n,
        date: BigInt(Date.now()) * 1_000_000n,
        amount: 100_000_000n,
        subscriptionId: 42n,
        service: Principal.fromText('aaaaa-aa'),
        result: { Ok: 1n },
        fee: 10_000n,
        ledgerTransactionId: 1n,
        transactionId: 1n,
        feeTransactionId: [],
        account: { owner: Principal.fromText('aaaaa-aa'), subaccount: [] },
      },
    ];
    renderPage();
    expect(screen.getByText('ICP')).toBeInTheDocument();
  });
});
