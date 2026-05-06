export interface TokenOption {
  value: string;
  label: string;
}

export function sortTokenOptions(options: TokenOption[]): TokenOption[] {
  return [...options].sort((left, right) =>
    left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }),
  );
}