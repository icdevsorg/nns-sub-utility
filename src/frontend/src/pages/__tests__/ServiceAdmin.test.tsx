import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ServiceAdmin } from '../ServiceAdmin';
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
const subsMock = { data: undefined as any, isPending: false };
const paysMock = { data: undefined as any, isPending: false };
const revenueMock = { data: undefined as any, isPending: false };
const confirmMock = { mutateAsync: vi.fn().mockResolvedValue([]), isPending: false };
const tokenMock = { data: undefined as any, isPending: false };
const revenueCalls: Array<{ start: bigint; end: bigint }> = [];

vi.mock('../../hooks/useServiceSubscriptions', () => ({
  useServiceSubscriptions: () => subsMock,
}));
vi.mock('../../hooks/useServicePayments', () => ({
  useServicePayments: () => paysMock,
}));
vi.mock('../../hooks/useServiceDailyRevenue', () => ({
  useServiceDailyRevenue: (_service: string | undefined, _productId: bigint | undefined, start: bigint, end: bigint) => {
    revenueCalls.push({ start, end });
    return revenueMock;
  },
}));
vi.mock('../../hooks/useConfirmSubscription', () => ({
  useConfirmSubscription: () => confirmMock,
}));
vi.mock('../../hooks/useTokenInfo', () => ({
  useTokenInfo: () => tokenMock,
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
  paysMock.data = undefined;
  paysMock.isPending = false;
  revenueMock.data = undefined;
  revenueMock.isPending = false;
  revenueCalls.length = 0;
  confirmMock.mutateAsync.mockClear();
  confirmMock.isPending = false;
  authMock.isAuthenticated = true;
  authMock.isLoading = false;
  tokenMock.data = [
    {
      tokenCanister: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
      tokenSymbol: 'ICP',
      tokenDecimals: 8,
      tokenFee: [10_000n],
      standards: ['ICRC-1', 'ICRC-2'],
    },
  ];
  tokenMock.isPending = false;
}

beforeEach(resetMocks);

function renderPage() {
  return render(
    <MemoryRouter>
      <ServiceAdmin />
    </MemoryRouter>,
  );
}

function loadService() {
  const input = screen.getByPlaceholderText('aaaaa-aa');
  fireEvent.change(input, { target: { value: 'aaaaa-aa' } });
  fireEvent.click(screen.getByText('Load'));
}

describe('ServiceAdmin', () => {
  it('renders heading', () => {
    renderPage();
    expect(screen.getByText('Service Admin')).toBeInTheDocument();
  });

  it('renders service principal input', () => {
    renderPage();
    expect(screen.getByPlaceholderText('aaaaa-aa')).toBeInTheDocument();
    expect(screen.getByText('Load')).toBeInTheDocument();
  });

  it('shows invalid principal message', () => {
    renderPage();
    const input = screen.getByPlaceholderText('aaaaa-aa');
    fireEvent.change(input, { target: { value: 'not-a-principal' } });
    expect(screen.getByText('Invalid principal')).toBeInTheDocument();
  });

  it('Load button is disabled for invalid principal', () => {
    renderPage();
    const input = screen.getByPlaceholderText('aaaaa-aa');
    fireEvent.change(input, { target: { value: 'invalid' } });
    expect(screen.getByText('Load')).toBeDisabled();
  });

  it('shows "Use my principal" when authenticated', () => {
    renderPage();
    expect(screen.getByText(/Use my principal/)).toBeInTheDocument();
  });

  it('hides "Use my principal" when not authenticated', () => {
    authMock.isAuthenticated = false;
    authMock.principal = null as any;
    renderPage();
    expect(screen.queryByText(/Use my principal/)).not.toBeInTheDocument();
  });

  it('does not show tabs before loading a service', () => {
    renderPage();
    // Tabs only appear after a service principal is loaded
    expect(screen.queryByText('Subscriptions')).not.toBeInTheDocument();
  });

  it('shows tabs after loading service', () => {
    subsMock.data = [];
    paysMock.data = [];
    renderPage();
    loadService();
    expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('Payments')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('DFX Commands')).toBeInTheDocument();
  });

  it('shows subscription empty state', () => {
    subsMock.data = [];
    renderPage();
    loadService();
    expect(screen.getByText('No subscriptions found for this service.')).toBeInTheDocument();
  });

  it('renders subscription table with data', () => {
    subsMock.data = [mockSub()];
    renderPage();
    loadService();
    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('shows the deep link builder once a service is loaded', () => {
    subsMock.data = [];
    renderPage();
    loadService();
    expect(screen.getByText('Service Deep Link Builder')).toBeInTheDocument();
    expect((screen.getByLabelText('Generated deep link') as HTMLTextAreaElement).value).toContain(
      '/#/subscribe?service=aaaaa-aa&interval=Monthly',
    );
  });

  it('offers supported tokens in the builder dropdown', () => {
    subsMock.data = [];
    renderPage();
    loadService();

    expect(screen.getByRole('option', { name: /ICP \(ryjl3-tyaaa-aaaaa-aaaba-cai\)/ })).toBeInTheDocument();
  });

  it('seeds the builder from a subscription row', () => {
    subsMock.data = [mockSub({ productId: [42n] })];
    renderPage();
    loadService();

    fireEvent.click(screen.getByText('Build Link'));

    expect((screen.getByLabelText('Generated deep link') as HTMLTextAreaElement).value).toContain(
      '/#/subscribe?token=ryjl3-tyaaa-aaaaa-aaaba-cai&service=aaaaa-aa&amount=100000000&interval=Monthly&product=42',
    );
  });

  it('switches to payments tab', () => {
    subsMock.data = [];
    paysMock.data = [];
    renderPage();
    loadService();
    fireEvent.click(screen.getByText('Payments'));
    expect(screen.getByText('No payments found for this service.')).toBeInTheDocument();
  });

  it('switches to revenue tab', () => {
    subsMock.data = [];
    revenueMock.data = [];
    renderPage();
    loadService();
    fireEvent.click(screen.getByText('Revenue'));
    expect(screen.getByText(/Daily Revenue/)).toBeInTheDocument();
    expect(screen.getByText(/Revenue is recorded when a payment settles/)).toBeInTheDocument();
  });

  it('requests revenue in nanoseconds rather than day counts', () => {
    subsMock.data = [];
    revenueMock.data = [];
    renderPage();
    loadService();

    const lastCall = revenueCalls[revenueCalls.length - 1];
    expect(lastCall).toBeDefined();
    expect(lastCall!.end).toBeGreaterThan(1_000_000_000_000_000_000n);
    expect(lastCall!.end - lastCall!.start).toBe(2_592_000_000_000_000n);
  });

  it('switches to DFX commands tab', () => {
    subsMock.data = [];
    renderPage();
    loadService();
    fireEvent.click(screen.getByText('DFX Commands'));
    // DfxCommandBuilder renders a command method select and generated command
    expect(screen.getByText('Generated Command')).toBeInTheDocument();
  });

  it('shows status filter tabs on subscriptions view', () => {
    subsMock.data = [];
    renderPage();
    loadService();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });
});
