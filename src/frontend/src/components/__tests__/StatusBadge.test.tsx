import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';
import type { SubStatus } from '../../canister/subs';

describe('StatusBadge', () => {
  it('renders "Active" for Active status', () => {
    const status = { Active: null } as unknown as SubStatus;
    render(<StatusBadge status={status} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders "Paused" for Paused status', () => {
    const status = { Paused: null } as unknown as SubStatus;
    render(<StatusBadge status={status} />);
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('renders "Cancelling" for WillCancel status', () => {
    const status = { WillCancel: null } as unknown as SubStatus;
    render(<StatusBadge status={status} />);
    expect(screen.getByText('Cancelling')).toBeInTheDocument();
  });

  it('renders "Cancelled" for Canceled status', () => {
    const status = { Canceled: null } as unknown as SubStatus;
    render(<StatusBadge status={status} />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('applies emerald color class for Active', () => {
    const status = { Active: null } as unknown as SubStatus;
    render(<StatusBadge status={status} />);
    const badge = screen.getByText('Active');
    expect(badge.className).toContain('text-emerald-400');
  });

  it('applies yellow color class for Paused', () => {
    const status = { Paused: null } as unknown as SubStatus;
    render(<StatusBadge status={status} />);
    const badge = screen.getByText('Paused');
    expect(badge.className).toContain('text-yellow-400');
  });

  it('applies red color class for WillCancel', () => {
    const status = { WillCancel: null } as unknown as SubStatus;
    render(<StatusBadge status={status} />);
    const badge = screen.getByText('Cancelling');
    expect(badge.className).toContain('text-red-400');
  });
});
