import { describe, expect, it } from 'vitest';
import { buildSubscribeDeepLink, serializeIntervalForDeepLink } from '../deepLink';

describe('deepLink utilities', () => {
  it('builds a relative deep link with only provided params', () => {
    const link = buildSubscribeDeepLink({
      service: 'aaaaa-aa',
      token: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
      amount: '100000000',
      interval: 'Monthly',
      product: '42',
    });

    expect(link).toBe('/#/subscribe?token=ryjl3-tyaaa-aaaaa-aaaba-cai&service=aaaaa-aa&amount=100000000&interval=Monthly&product=42');
  });

  it('includes intervalValue for custom intervals and encodes redirect', () => {
    const link = buildSubscribeDeepLink({
      service: 'aaaaa-aa',
      interval: 'Days',
      intervalValue: '14',
      redirect: 'https://example.com/after?from=subs',
    }, { origin: 'https://subs.example.com' });

    expect(link).toBe('https://subs.example.com/#/subscribe?service=aaaaa-aa&interval=Days&intervalValue=14&redirect=https%3A%2F%2Fexample.com%2Fafter%3Ffrom%3Dsubs');
  });

  it('serializes custom interval variants from subscription data', () => {
    expect(serializeIntervalForDeepLink({ Weeks: 3n } as any)).toEqual({
      interval: 'Weeks',
      intervalValue: '3',
    });
  });

  it('preserves target and broker account strings in generated links', () => {
    const link = buildSubscribeDeepLink({
      service: 'aaaaa-aa',
      targetAccount: 'aaaaa-aa:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      broker: 'ryjl3-tyaaa-aaaaa-aaaba-cai:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    });

    expect(link).toContain('targetAccount=aaaaa-aa%3A0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
    expect(link).toContain('broker=ryjl3-tyaaa-aaaaa-aaaba-cai%3Affffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
  });
});