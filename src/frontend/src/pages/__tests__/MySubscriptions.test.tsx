import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MySubscriptions } from '../MySubscriptions';
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
const subsMock = { data: undefined as any, isPending: false, isError: false };
const cancelMock = { mutate: vi.fn(), isPending: false };
const pauseMock = { mutate: vi.fn(), isPending: false };

vi.mock('../../hooks/useUserSubscriptions', () => ({
  useUserSubscriptions: () => subsMock,
}));
vi.mock('../../hooks/useCancelSubscription', () => ({
  useCancelSubscription: () => cancelMock,
}));
vi.mock('../../hooks/usePauseSubscription', () => ({
  usePauseSubscription: () => pauseMock,
}));

function mockSub(overrides: Record<string, unknown> = {}) {
  return {
    subscriptionId: 1n,
    serviceCanister: Principal.fromText('aaaaa-aa'),
    tokenCanister: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
    amountPerInterval: 100_000_000n,
    interval: { Monthly: null },
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
  subsMock.data = undefined;
  subsMock.isPending = false;
  subsMock.isError = false;
  cancelMock.mutate.mockClear();
  cancelMock.isPending = false;
  pauseMock.mutate.mockClear();
  pauseMock.isPending = false;
  authMock.isAuthenticated = true;
  authMock.isLoading = false;
}

beforeEach(resetMocks);

function renderPage() {
  return render(
    <MemoryRouter>
      <MySubscriptions />
    </MemoryRouter>,
  );
}

describe('MySubscriptions', () => {
  it('renders heading when authenticated', () => {
    subsMock.data = [];
    renderPage();
    expect(screen.getByText('My Subscriptions')).toBeInTheDocument();
  });

  it('shows auth-required when not authenticated', () => {
    authMock.isAuthenticated = false;
    renderPage();
    expect(screen.queryByText('My Subscriptions')).not.toBeInTheDocument();
  });

  it('shows loading spinner when pending', () => {
    subsMock.isPending = true;
    const { container } = renderPage();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message on failure', () => {
    subsMock.isError = true;
    renderPage();
    expect(screen.getByText(/Failed to load subscriptions/)).toBeInTheDocument();
  });

  it('shows empty state when no subscriptions', () => {
    subsMock.data = [];
    renderPage();
    expect(screen.getByText('No subscriptions found.')).toBeInTheDocument();
  });

  it('renders subscription cards', () => {
    subsMock.data = [mockSub()];
    renderPage();
    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('renders status filter tabs', () => {
    subsMock.data = [];
    renderPage();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();
    expect(screen.getByText('Cancelling')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('renders pagination controls', () => {
    subsMock.data = [mockSub()];
    renderPage();
    expect(screen.getByText('← Previous')).toBeInTheDocument();
    expect(screen.getByText('Next →')).toBeInTheDocument();
    expect(screen.getByText('Page 1')).toBeInTheDocument();
  });

  it('previous button is disabled on first page', () => {
    subsMock.data = [mockSub()];
    renderPage();
    expect(screen.getByText('← Previous')).toBeDisabled();
  });
});
