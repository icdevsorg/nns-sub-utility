import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RevenueChart } from '../RevenueChart';

function mockEntry(dayKey: bigint, amount: bigint) {
  return { dayKey, amount };
}

describe('RevenueChart', () => {
  it('renders empty state message when no data', () => {
    render(<RevenueChart data={[]} />);
    expect(screen.getByText('No revenue data for this period.')).toBeInTheDocument();
  });

  it('renders bars for each entry', () => {
    const data = [
      mockEntry(20000n, 100_000_000n),
      mockEntry(20001n, 200_000_000n),
    ];
    const { container } = render(<RevenueChart data={data as any} />);
    // Should have 2 bar rows
    const bars = container.querySelectorAll('.bg-emerald-600\\/60');
    expect(bars.length).toBe(2);
  });

  it('renders date labels', () => {
    // Day 20000 is ~2024-10-04
    const data = [mockEntry(20000n, 50_000_000n)];
    render(<RevenueChart data={data as any} />);
    // Should render some date text (month + day)
    const texts = screen.getAllByText(/\w+ \d+/);
    expect(texts.length).toBeGreaterThan(0);
  });

  it('appends symbol when provided', () => {
    const data = [mockEntry(20000n, 100_000_000n)];
    render(<RevenueChart data={data as any} symbol="ICP" />);
    expect(screen.getByText(/ICP/)).toBeInTheDocument();
  });
});
