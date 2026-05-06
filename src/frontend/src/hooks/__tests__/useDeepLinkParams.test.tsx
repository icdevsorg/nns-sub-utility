import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useDeepLinkParams } from '../useDeepLinkParams';
import type { ReactNode } from 'react';

function wrapper(initialEntries: string[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;
  };
}

describe('useDeepLinkParams', () => {
  it('returns empty object when no params', () => {
    const { result } = renderHook(() => useDeepLinkParams(), {
      wrapper: wrapper(['/subscribe']),
    });
    expect(result.current).toEqual({});
  });

  it('parses token param', () => {
    const { result } = renderHook(() => useDeepLinkParams(), {
      wrapper: wrapper(['/subscribe?token=ryjl3-tyaaa-aaaaa-aaaba-cai']),
    });
    expect(result.current.token).toBe('ryjl3-tyaaa-aaaaa-aaaba-cai');
  });

  it('parses service param', () => {
    const { result } = renderHook(() => useDeepLinkParams(), {
      wrapper: wrapper(['/subscribe?service=aaaaa-aa']),
    });
    expect(result.current.service).toBe('aaaaa-aa');
  });

  it('parses amount param', () => {
    const { result } = renderHook(() => useDeepLinkParams(), {
      wrapper: wrapper(['/subscribe?amount=100000000']),
    });
    expect(result.current.amount).toBe('100000000');
  });

  it('parses interval param', () => {
    const { result } = renderHook(() => useDeepLinkParams(), {
      wrapper: wrapper(['/subscribe?interval=Monthly']),
    });
    expect(result.current.interval).toBe('Monthly');
  });

  it('parses multiple params at once', () => {
    const { result } = renderHook(() => useDeepLinkParams(), {
      wrapper: wrapper(['/subscribe?token=abc&service=def&amount=100&interval=Days&intervalValue=7&product=42']),
    });
    expect(result.current).toEqual({
      token: 'abc',
      service: 'def',
      amount: '100',
      interval: 'Days',
      intervalValue: '7',
      product: '42',
    });
  });

  it('parses optional params (redirect, endDate, memo, targetAccount, broker)', () => {
    const { result } = renderHook(() => useDeepLinkParams(), {
      wrapper: wrapper(['/subscribe?redirect=https://example.com&endDate=2025-01-01&memo=test&targetAccount=abc&broker=xyz']),
    });
    expect(result.current.redirect).toBe('https://example.com');
    expect(result.current.endDate).toBe('2025-01-01');
    expect(result.current.memo).toBe('test');
    expect(result.current.targetAccount).toBe('abc');
    expect(result.current.broker).toBe('xyz');
  });

  it('ignores unknown params', () => {
    const { result } = renderHook(() => useDeepLinkParams(), {
      wrapper: wrapper(['/subscribe?unknown=hello&token=abc']),
    });
    expect(result.current.token).toBe('abc');
    expect((result.current as any).unknown).toBeUndefined();
  });
});
