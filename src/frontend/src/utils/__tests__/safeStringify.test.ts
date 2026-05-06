import { afterEach, describe, expect, it } from 'vitest';
import { safeStringify } from '../safeStringify';

const originalBigIntToJson = (BigInt.prototype as any).toJSON;

afterEach(() => {
  if (originalBigIntToJson) {
    (BigInt.prototype as any).toJSON = originalBigIntToJson;
    return;
  }

  delete (BigInt.prototype as any).toJSON;
});

describe('safeStringify', () => {
  it('serializes bigint values without relying on BigInt.toJSON', () => {
    delete (BigInt.prototype as any).toJSON;

    expect(safeStringify({ amount: 5n, nested: { txId: 9n } })).toBe(
      '{"amount":"5","nested":{"txId":"9"}}',
    );
  });
});