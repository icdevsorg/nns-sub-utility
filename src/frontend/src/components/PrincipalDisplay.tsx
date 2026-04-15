import { useState } from 'react';

interface PrincipalDisplayProps {
  principal: string;
  short?: boolean;
}

function shorten(text: string): string {
  if (text.length <= 16) return text;
  return `${text.slice(0, 7)}...${text.slice(-5)}`;
}

export function PrincipalDisplay({ principal, short = true }: PrincipalDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(principal).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      onClick={handleCopy}
      title={principal}
      className="inline-flex items-center gap-1 font-mono text-sm text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
    >
      {short ? shorten(principal) : principal}
      <span className="text-xs text-slate-500">{copied ? '✓' : '⧉'}</span>
    </button>
  );
}
