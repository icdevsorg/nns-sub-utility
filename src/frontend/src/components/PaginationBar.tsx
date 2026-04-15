interface PaginationBarProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationBar({ page, totalPages, onPageChange }: PaginationBarProps) {
  return (
    <div className="flex items-center justify-between mt-6">
      <button
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="px-4 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
      >
        ← Previous
      </button>
      <span className="text-sm text-slate-400">
        Page {page + 1} of {totalPages || 1}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page + 1 >= totalPages}
        className="px-4 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
      >
        Next →
      </button>
    </div>
  );
}
