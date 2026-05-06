import { PrincipalDisplay } from './PrincipalDisplay';

interface TokenPrincipalDisplayProps {
  principal: string;
  symbol?: string;
  shortPrincipal?: boolean;
}

export function TokenPrincipalDisplay({ principal, symbol, shortPrincipal = true }: TokenPrincipalDisplayProps) {
  return (
    <span className="inline-flex items-center gap-2 flex-wrap">
      {symbol && <span className="text-emerald-400 font-medium">{symbol}</span>}
      <PrincipalDisplay principal={principal} short={shortPrincipal} />
    </span>
  );
}