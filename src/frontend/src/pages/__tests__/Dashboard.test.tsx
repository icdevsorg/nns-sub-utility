import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Dashboard } from '../Dashboard';
import { Principal } from '@dfinity/principal';

// ------- hook mocks -------
const metaMock = { data: undefined as any, isPending: false, isError: false };
const blocksMock = { data: undefined as any, isPending: false, isError: false };
const tokenMock = { data: undefined as any, isPending: false };
const leaderMock = { data: undefined as any, isPending: false };

vi.mock('../../hooks/useMetadata', () => ({
  useMetadata: () => metaMock,
}));
vi.mock('../../hooks/useRecentBlocks', () => ({
  useRecentBlocks: () => blocksMock,
}));
vi.mock('../../hooks/useTokenInfo', () => ({
  useTokenInfo: () => tokenMock,
}));
vi.mock('../../hooks/useServiceLeaderboard', () => ({
  useServiceLeaderboard: () => leaderMock,
}));

function resetMocks() {
  metaMock.data = undefined;
  metaMock.isPending = false;
  metaMock.isError = false;
  blocksMock.data = undefined;
  blocksMock.isPending = false;
  blocksMock.isError = false;
  tokenMock.data = undefined;
  tokenMock.isPending = false;
  leaderMock.data = undefined;
  leaderMock.isPending = false;
}

beforeEach(resetMocks);

describe('Dashboard', () => {
  it('renders heading', () => {
    render(<Dashboard />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('shows stat cards with zero defaults when no data', () => {
    render(<Dashboard />);
    expect(screen.getByText('Total Blocks')).toBeInTheDocument();
    expect(screen.getByText('Supported Tokens')).toBeInTheDocument();
    expect(screen.getByText('Max Query Batch')).toBeInTheDocument();
    expect(screen.getByText('Default Take')).toBeInTheDocument();
  });

  it('shows loading spinners when hooks are pending', () => {
    blocksMock.isPending = true;
    leaderMock.isPending = true;
    const { container } = render(<Dashboard />);
    const spinners = container.querySelectorAll('.animate-spin');
    expect(spinners.length).toBeGreaterThanOrEqual(1);
  });

  it('shows block error message', () => {
    blocksMock.isError = true;
    render(<Dashboard />);
    expect(screen.getByText(/Failed to load recent blocks/)).toBeInTheDocument();
  });

  it('renders leaderboard entries', () => {
    leaderMock.data = [
      {
        service: Principal.fromText('aaaaa-aa'),
        tokenCanister: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
        totalRevenue: 500_000_000n,
        activeSubscriptions: 3n,
      },
    ];
    tokenMock.data = [
      {
        tokenCanister: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
        tokenSymbol: 'ICP',
        tokenDecimals: 8,
        tokenFee: [10_000n],
        standards: ['ICRC-1', 'ICRC-2'],
      },
    ];
    render(<Dashboard />);
    expect(screen.getByText('Top Services by Revenue')).toBeInTheDocument();
    expect(screen.getAllByText('ICP').length).toBeGreaterThan(0);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows empty leaderboard message', () => {
    leaderMock.data = [];
    render(<Dashboard />);
    expect(screen.getByText('No service data yet.')).toBeInTheDocument();
  });

  it('renders recent blocks table', () => {
    blocksMock.data = {
      logLength: 5n,
      blocks: [
        {
          id: 1n,
          block: {
            Map: [
              ['tx', { Map: [['op', { Text: '79subscribe' }]] }],
            ],
          },
        },
      ],
    };
    render(<Dashboard />);
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('79subscribe')).toBeInTheDocument();
  });

  it('shows empty blocks message', () => {
    blocksMock.data = { logLength: 0n, blocks: [] };
    render(<Dashboard />);
    expect(screen.getByText('No blocks yet.')).toBeInTheDocument();
  });

  it('renders supported tokens table', () => {
    tokenMock.data = [
      {
        tokenCanister: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
        tokenSymbol: 'ICP',
        tokenDecimals: 8,
        tokenFee: [10_000n],
        standards: ['ICRC-1', 'ICRC-2'],
      },
    ];
    render(<Dashboard />);
    expect(screen.getByText('ICP')).toBeInTheDocument();
    expect(screen.getByText('ICRC-1, ICRC-2')).toBeInTheDocument();
  });

  it('renders the revenue leaderboard before supported tokens', () => {
    tokenMock.data = [
      {
        tokenCanister: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
        tokenSymbol: 'ICP',
        tokenDecimals: 8,
        tokenFee: [10_000n],
        standards: ['ICRC-1', 'ICRC-2'],
      },
    ];
    leaderMock.data = [
      {
        service: Principal.fromText('aaaaa-aa'),
        tokenCanister: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
        totalRevenue: 500_000_000n,
        activeSubscriptions: 3n,
      },
    ];

    render(<Dashboard />);
    const sectionHeadings = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
    expect(sectionHeadings.indexOf('Top Services by Revenue')).toBeLessThan(sectionHeadings.indexOf('Supported Tokens'));
  });

  it('groups leaderboard rows by token and formats totals with token decimals', () => {
    tokenMock.data = [
      {
        tokenCanister: Principal.fromText('agtsn-xyaaa-aaaag-ak3kq-cai'),
        tokenSymbol: 'ICDV',
        tokenDecimals: 2,
        tokenFee: [1n],
        standards: ['ICRC-1', 'ICRC-2'],
      },
    ];
    leaderMock.data = [
      {
        service: Principal.fromText('aaaaa-aa'),
        tokenCanister: Principal.fromText('agtsn-xyaaa-aaaag-ak3kq-cai'),
        totalRevenue: 1234n,
        activeSubscriptions: 2n,
      },
    ];

    render(<Dashboard />);

    expect(screen.getAllByText('ICDV').length).toBeGreaterThan(0);
    expect(screen.getByText('12.34')).toBeInTheDocument();
    expect(screen.getByText(/Revenue is separated by token/)).toBeInTheDocument();
  });

  it('renders metadata stat values', () => {
    const m = new Map<string, unknown>();
    m.set('icrc79:max_query_batch_size', { Nat: 100n });
    m.set('icrc79:default_take_value', { Nat: 20n });
    metaMock.data = m;
    render(<Dashboard />);
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });
});
