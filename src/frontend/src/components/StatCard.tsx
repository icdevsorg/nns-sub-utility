interface StatCardProps {
  label: string;
  value: string;
  isLoading?: boolean;
  isError?: boolean;
}

export function StatCard({ label, value, isLoading, isError }: StatCardProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      {isLoading ? (
        <div className="h-8 w-24 bg-slate-700 rounded animate-pulse" />
      ) : isError ? (
        <p className="text-red-400 text-sm">Failed to load</p>
      ) : (
        <p className="text-2xl font-bold text-emerald-400">{value}</p>
      )}
    </div>
  );
}
