import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IntervalLabel, formatInterval } from '../IntervalLabel';
import type { Interval } from '../../canister/subs';

describe('formatInterval', () => {
  it('returns "Hourly"', () => {
    expect(formatInterval({ Hourly: null } as unknown as Interval)).toBe('Hourly');
  });

  it('returns "Daily"', () => {
    expect(formatInterval({ Daily: null } as unknown as Interval)).toBe('Daily');
  });

  it('returns "Weekly"', () => {
    expect(formatInterval({ Weekly: null } as unknown as Interval)).toBe('Weekly');
  });

  it('returns "Monthly"', () => {
    expect(formatInterval({ Monthly: null } as unknown as Interval)).toBe('Monthly');
  });

  it('returns "Yearly"', () => {
    expect(formatInterval({ Yearly: null } as unknown as Interval)).toBe('Yearly');
  });

  it('returns custom days label', () => {
    expect(formatInterval({ Days: 14n } as unknown as Interval)).toBe('Every 14 days');
  });

  it('returns custom weeks label', () => {
    expect(formatInterval({ Weeks: 2n } as unknown as Interval)).toBe('Every 2 weeks');
  });

  it('returns custom months label', () => {
    expect(formatInterval({ Months: 3n } as unknown as Interval)).toBe('Every 3 months');
  });

  it('formats nanosecond intervals as minutes', () => {
    // 30 minutes = 30 * 60 * 1e9 nanoseconds
    const ns = BigInt(30 * 60) * 1_000_000_000n;
    expect(formatInterval({ Interval: ns } as unknown as Interval)).toBe('Every 30 min');
  });

  it('formats nanosecond intervals as hours', () => {
    // 6 hours
    const ns = BigInt(6 * 3600) * 1_000_000_000n;
    expect(formatInterval({ Interval: ns } as unknown as Interval)).toBe('Every 6 hr');
  });

  it('formats nanosecond intervals as days', () => {
    // 2 days
    const ns = BigInt(2 * 86400) * 1_000_000_000n;
    expect(formatInterval({ Interval: ns } as unknown as Interval)).toBe('Every 2 days');
  });
});

describe('IntervalLabel', () => {
  it('renders the formatted interval', () => {
    render(<IntervalLabel interval={{ Monthly: null } as unknown as Interval} />);
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });
});
