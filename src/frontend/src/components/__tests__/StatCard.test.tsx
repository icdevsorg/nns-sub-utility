import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '../StatCard';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Total Subs" value="42" />);
    expect(screen.getByText('Total Subs')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('shows loading skeleton when isLoading', () => {
    const { container } = render(<StatCard label="Total Subs" value="42" isLoading />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByText('42')).not.toBeInTheDocument();
  });

  it('shows error state when isError', () => {
    render(<StatCard label="Total Subs" value="42" isError />);
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
    expect(screen.queryByText('42')).not.toBeInTheDocument();
  });

  it('renders label always, even in loading state', () => {
    render(<StatCard label="Active" value="10" isLoading />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
