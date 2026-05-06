export function safeStringify(value: unknown, space?: number): string {
  const serialized = JSON.stringify(
    value,
    (_key, currentValue) => (typeof currentValue === 'bigint' ? currentValue.toString() : currentValue),
    space,
  );

  return serialized ?? String(value);
}