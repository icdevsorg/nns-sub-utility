import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SubscriptionCard } from '../SubscriptionCard';
import { Principal } from '@dfinity/principal';

function mockSubscription(overrides: Record<string, unknown> = {}) {
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

describe('SubscriptionCard', () => {
  it('renders subscription ID as a link', () => {
    render(
      <MemoryRouter>
        <SubscriptionCard subscription={mockSubscription() as any} />
      </MemoryRouter>,
    );
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#1').closest('a')).toHaveAttribute('href', '/subscriptions/1');
  });

  it('renders status badge', () => {
    render(
      <MemoryRouter>
        <SubscriptionCard subscription={mockSubscription() as any} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders amount', () => {
    render(
      <MemoryRouter>
        <SubscriptionCard subscription={mockSubscription({ amountPerInterval: 150_000_000n }) as any} />
      </MemoryRouter>,
    );
    expect(screen.getByText('1.5')).toBeInTheDocument();
  });

  it('renders interval', () => {
    render(
      <MemoryRouter>
        <SubscriptionCard subscription={mockSubscription() as any} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  it('shows Pause button for active subscription', () => {
    const onPause = vi.fn();
    render(
      <MemoryRouter>
        <SubscriptionCard subscription={mockSubscription() as any} onPause={onPause} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Pause')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Pause'));
    expect(onPause).toHaveBeenCalled();
  });

  it('shows Resume button for paused subscription', () => {
    const onResume = vi.fn();
    render(
      <MemoryRouter>
        <SubscriptionCard subscription={mockSubscription({ status: { Paused: null } }) as any} onResume={onResume} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Resume')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Resume'));
    expect(onResume).toHaveBeenCalled();
  });

  it('shows Cancel button for active subscription', () => {
    const onCancel = vi.fn();
    render(
      <MemoryRouter>
        <SubscriptionCard subscription={mockSubscription() as any} onCancel={onCancel} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('hides action buttons for canceled subscription', () => {
    render(
      <MemoryRouter>
        <SubscriptionCard subscription={mockSubscription({ status: { Canceled: null } }) as any} onPause={() => {}} onCancel={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.queryByText('Pause')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('disables buttons when isPending', () => {
    render(
      <MemoryRouter>
        <SubscriptionCard subscription={mockSubscription() as any} onPause={() => {}} onCancel={() => {}} isPending />
      </MemoryRouter>,
    );
    expect(screen.getByText('Pause')).toBeDisabled();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });

  it('renders product ID when present', () => {
    render(
      <MemoryRouter>
        <SubscriptionCard subscription={mockSubscription({ productId: [42n] }) as any} />
      </MemoryRouter>,
    );
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders the token symbol while preserving the copyable principal', () => {
    render(
      <MemoryRouter>
        <SubscriptionCard subscription={mockSubscription() as any} tokenSymbol="ICP" />
      </MemoryRouter>,
    );
    expect(screen.getByText('ICP')).toBeInTheDocument();
    expect(screen.getByTitle('ryjl3-tyaaa-aaaaa-aaaba-cai')).toBeInTheDocument();
  });
});
