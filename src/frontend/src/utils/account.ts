import { Principal } from '@dfinity/principal';

const SUBACCOUNT_HEX_LENGTH = 64;

export interface ParsedAccountText {
  owner: string;
  subaccount: string;
}

export function isValidPrincipal(text: string): boolean {
  try {
    Principal.fromText(text);
    return true;
  } catch {
    return false;
  }
}

export function parseAccountText(text: string): ParsedAccountText {
  const trimmed = text.trim();
  if (!trimmed) return { owner: '', subaccount: '' };

  const separatorIndex = trimmed.indexOf(':');
  if (separatorIndex === -1) {
    return { owner: trimmed, subaccount: '' };
  }

  return {
    owner: trimmed.slice(0, separatorIndex).trim(),
    subaccount: normalizeSubaccountHex(trimmed.slice(separatorIndex + 1)),
  };
}

export function formatAccountText({ owner, subaccount }: ParsedAccountText): string {
  const trimmedOwner = owner.trim();
  const normalizedSubaccount = normalizeSubaccountHex(subaccount);

  if (!trimmedOwner) return normalizedSubaccount ? `:${normalizedSubaccount}` : '';
  return normalizedSubaccount ? `${trimmedOwner}:${normalizedSubaccount}` : trimmedOwner;
}

export function isValidSubaccountHex(text: string): boolean {
  const normalized = normalizeSubaccountHex(text);
  return normalized.length === SUBACCOUNT_HEX_LENGTH && /^[0-9a-f]+$/i.test(normalized);
}

export function isValidAccountText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const parsed = parseAccountText(trimmed);
  if (!parsed.owner || !isValidPrincipal(parsed.owner)) {
    return false;
  }

  return !parsed.subaccount || isValidSubaccountHex(parsed.subaccount);
}

export function parseAccountForCandid(text: string): { owner: Principal; subaccount: [] | [Uint8Array] } | null {
  if (!isValidAccountText(text)) return null;

  const parsed = parseAccountText(text);
  return {
    owner: Principal.fromText(parsed.owner),
    subaccount: parsed.subaccount ? [hexToBytes(parsed.subaccount)] : [],
  };
}

export function normalizeSubaccountHex(text: string): string {
  return text.trim().replace(/^0x/i, '').toLowerCase();
}

function hexToBytes(hex: string): Uint8Array {
  const normalized = normalizeSubaccountHex(hex);
  const bytes = new Uint8Array(normalized.length / 2);

  for (let index = 0; index < normalized.length; index += 2) {
    bytes[index / 2] = Number.parseInt(normalized.slice(index, index + 2), 16);
  }

  return bytes;
}