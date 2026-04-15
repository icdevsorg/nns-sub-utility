import type { Interval } from '../canister/subs';

export function formatInterval(interval: Interval): string {
  if ('Hourly' in interval) return 'Hourly';
  if ('Daily' in interval) return 'Daily';
  if ('Weekly' in interval) return 'Weekly';
  if ('Monthly' in interval) return 'Monthly';
  if ('Yearly' in interval) return 'Yearly';
  if ('Days' in interval) return `Every ${interval.Days.toString()} days`;
  if ('Weeks' in interval) return `Every ${interval.Weeks.toString()} weeks`;
  if ('Months' in interval) return `Every ${interval.Months.toString()} months`;
  if ('Interval' in interval) {
    const secs = Number(interval.Interval) / 1_000_000_000;
    if (secs < 3600) return `Every ${Math.round(secs / 60)} min`;
    if (secs < 86400) return `Every ${Math.round(secs / 3600)} hr`;
    return `Every ${Math.round(secs / 86400)} days`;
  }
  return 'Custom';
}

export function IntervalLabel({ interval }: { interval: Interval }) {
  return <span>{formatInterval(interval)}</span>;
}
