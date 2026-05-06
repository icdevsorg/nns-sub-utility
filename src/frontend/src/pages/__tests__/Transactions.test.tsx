import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Principal } from '@dfinity/principal';
import { Transactions } from '../Transactions';

const blocksMock = { data: undefined as any, isPending: false, isError: false };
const tokenMock = { data: undefined as any };

vi.mock('../../hooks/useTransactionBlocks', () => ({
  useTransactionBlocks: () => blocksMock,
}));

vi.mock('../../hooks/useTokenInfo', () => ({
  useTokenInfo: () => tokenMock,
}));

function resetMocks() {
  blocksMock.data = undefined;
  blocksMock.isPending = false;
  blocksMock.isError = false;
  tokenMock.data = [
    {
      tokenCanister: Principal.fromText('agtsn-xyaaa-aaaag-ak3kq-cai'),
      tokenSymbol: 'ICDV',
    },
  ];
}

beforeEach(resetMocks);

describe('Transactions', () => {
  it('shows the token symbol for payment blocks in the table and details', () => {
    blocksMock.data = {
      logLength: 1n,
      blocks: [
        {
          id: 7n,
          block: {
            Map: [
              ['btype', { Text: '79payment' }],
              ['ts', { Nat: 1_700_000_000_000_000_000n }],
              ['tx', {
                Map: [
                  ['op', { Text: '79payment' }],
                  ['tok', { Text: 'agtsn-xyaaa-aaaag-ak3kq-cai' }],
                  ['amt', { Nat: 100_000_000n }],
                  ['sid', { Nat: 42n }],
                ],
              }],
            ],
          },
        },
      ],
      page: 0,
    };

    render(<Transactions />);

    expect(screen.getByText('Token')).toBeInTheDocument();
    expect(screen.getAllByText('ICDV').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText('#7'));

    expect(screen.getByTitle('agtsn-xyaaa-aaaag-ak3kq-cai')).toBeInTheDocument();
  });
});