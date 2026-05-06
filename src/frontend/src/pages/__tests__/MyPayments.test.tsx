import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MyPayments } from '../MyPayments';
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
const paymentsMock = { data: undefined as any, isPending: false, isError: false };
const subscriptionsMock = { data: undefined as any };
const tokenMock = { data: undefined as any };

vi.mock('../../hooks/useUserPayments', () => ({
  useUserPayments: () => paymentsMock,
}));
vi.mock('../../hooks/useUserSubscriptions', () => ({
  useUserSubscriptions: () => subscriptionsMock,
}));
vi.mock('../../hooks/useTokenInfo', () => ({
  useTokenInfo: () => tokenMock,
}));

function mockPayment(id = 1n) {
  return {
    paymentId: id,
    date: BigInt(Date.now()) * 1_000_000n,
    amount: 100_000_000n,
    subscriptionId: 1n,
    service: Principal.fromText('aaaaa-aa'),
    result: { Ok: 1n },
    fee: 10_000n,
    ledgerTransactionId: 1n,
    transactionId: 1n,
    feeTransactionId: [],
    account: { owner: Principal.fromText('aaaaa-aa'), subaccount: [] },
  };
}

function resetMocks() {
  paymentsMock.data = undefined;
  paymentsMock.isPending = false;
  paymentsMock.isError = false;
  subscriptionsMock.data = [];
  tokenMock.data = [];
  authMock.isAuthenticated = true;
  authMock.isLoading = false;
}

beforeEach(resetMocks);

function renderPage() {
  return render(
    <MemoryRouter>
      <MyPayments />
    </MemoryRouter>,
  );
}

describe('MyPayments', () => {
  it('renders heading when authenticated', () => {
    paymentsMock.data = [];
    renderPage();
    expect(screen.getByText('My Payments')).toBeInTheDocument();
  });

  it('shows auth-required when not authenticated', () => {
    authMock.isAuthenticated = false;
    renderPage();
    expect(screen.queryByText('My Payments')).not.toBeInTheDocument();
  });

  it('shows loading spinner when pending', () => {
    paymentsMock.isPending = true;
    const { container } = renderPage();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message', () => {
    paymentsMock.isError = true;
    renderPage();
    expect(screen.getByText(/Failed to load payments/)).toBeInTheDocument();
  });

  it('shows empty state via PaymentTable', () => {
    paymentsMock.data = [];
    renderPage();
    expect(screen.getByText('No payments found.')).toBeInTheDocument();
  });

  it('renders payment table with data', () => {
    paymentsMock.data = [mockPayment(42n)];
    subscriptionsMock.data = [
      {
        subscriptionId: 1n,
        tokenCanister: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
      },
    ];
    tokenMock.data = [
      {
        tokenCanister: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
        tokenSymbol: 'ICP',
      },
    ];
    renderPage();
    expect(screen.getByText('#42')).toBeInTheDocument();
    expect(screen.getByText('ICP')).toBeInTheDocument();
  });

  it('renders pagination controls', () => {
    paymentsMock.data = [mockPayment()];
    renderPage();
    expect(screen.getByText('← Previous')).toBeInTheDocument();
    expect(screen.getByText('Next →')).toBeInTheDocument();
    expect(screen.getByText('Page 1')).toBeInTheDocument();
  });

  it('previous button is disabled on first page', () => {
    paymentsMock.data = [mockPayment()];
    renderPage();
    expect(screen.getByText('← Previous')).toBeDisabled();
  });

  it('renders description text', () => {
    paymentsMock.data = [];
    renderPage();
    expect(screen.getByText(/View your subscription payment history/)).toBeInTheDocument();
  });
});
