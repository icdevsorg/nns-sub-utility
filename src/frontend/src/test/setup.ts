import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
  writable: true,
});

// BigInt JSON serialization for test output
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
