import { describe, expect, it } from 'vitest';
import {
  formatAccountText,
  isValidAccountText,
  isValidSubaccountHex,
  parseAccountForCandid,
  parseAccountText,
} from '../account';

describe('account utilities', () => {
  it('parses principal-only account text', () => {
    expect(parseAccountText('aaaaa-aa')).toEqual({ owner: 'aaaaa-aa', subaccount: '' });
  });

  it('parses account strings with subaccounts', () => {
    expect(parseAccountText('aaaaa-aa:0x0011')).toEqual({ owner: 'aaaaa-aa', subaccount: '0011' });
  });

  it('formats account text from owner and subaccount', () => {
    expect(formatAccountText({ owner: 'aaaaa-aa', subaccount: '0x0011' })).toBe('aaaaa-aa:0011');
  });

  it('validates 64-character subaccount hex', () => {
    expect(isValidSubaccountHex('ab'.repeat(32))).toBe(true);
    expect(isValidSubaccountHex('ab')).toBe(false);
  });

  it('validates account text with owner and subaccount', () => {
    expect(isValidAccountText(`aaaaa-aa:${'ab'.repeat(32)}`)).toBe(true);
    expect(isValidAccountText('aaaaa-aa:bad')).toBe(false);
  });

  it('converts valid account text to candid account data', () => {
    const account = parseAccountForCandid(`aaaaa-aa:${'01'.repeat(32)}`);

    expect(account?.owner.toText()).toBe('aaaaa-aa');
    expect(account?.subaccount).toHaveLength(1);
    expect(account?.subaccount[0]).toBeInstanceOf(Uint8Array);
    expect((account?.subaccount[0] as Uint8Array)[0]).toBe(1);
  });
});