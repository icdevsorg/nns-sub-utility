import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaymentTable } from '../PaymentTable';
import { Principal } from '@dfinity/principal';

function mockPayment(overrides: Partial<{
  paymentId: bigint;
  date: bigint;
  amount: bigint;
  subscriptionId: bigint;
  service: Principal;
  result: { Ok: bigint } | { Err: { message: string } };
}> = {}) {
  return {
    paymentId: overrides.paymentId ?? 1n,
    date: overrides.date ?? BigInt(Date.now()) * 1_000_000n,
    amount: overrides.amount ?? 100_000_000n,
    subscriptionId: overrides.subscriptionId ?? 1n,
    service: overrides.service ?? Principal.fromText('aaaaa-aa'),
    result: overrides.result ?? { Ok: 1n },
    fee: 10_000n,
    ledgerTransactionId: 1n,
    transactionId: 1n,
    feeTransactionId: [] as bigint[],
    account: { owner: Principal.fromText('aaaaa-aa'), subaccount: [] },
  };
}

describe('PaymentTable', () => {
  it('renders empty state when no payments', () => {
    render(<PaymentTable payments={[]} />);
    expect(screen.getByText('No payments found.')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<PaymentTable payments={[mockPayment() as any]} />);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Token')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders payment row with ID', () => {
    render(<PaymentTable payments={[mockPayment({ paymentId: 42n }) as any]} />);
    expect(screen.getByText('#42')).toBeInTheDocument();
  });

  it('shows "Success" for Ok result', () => {
    render(<PaymentTable payments={[mockPayment({ result: { Ok: 1n } }) as any]} />);
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('shows "Error" for Err result', () => {
    render(<PaymentTable payments={[mockPayment({ result: { Err: { message: 'Insufficient funds' } } }) as any]} />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('formats amount correctly', () => {
    // 1.5 tokens = 150_000_000 with 8 decimals
    render(<PaymentTable payments={[mockPayment({ amount: 150_000_000n }) as any]} />);
    expect(screen.getByText('1.5')).toBeInTheDocument();
  });

  it('renders token symbol when a subscription token label is provided', () => {
    render(
      <PaymentTable
        payments={[mockPayment({ subscriptionId: 42n }) as any]}
        tokenLabelBySubscriptionId={{ '42': 'ICP' }}
      />,
    );
    expect(screen.getByText('ICP')).toBeInTheDocument();
  });
});
