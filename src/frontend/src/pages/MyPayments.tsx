import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useUserPayments } from '../hooks/useUserPayments';
import { AuthGuard } from '../components/AuthGuard';
import { PaymentTable } from '../components/PaymentTable';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { CONFIG } from '../config';

function MyPaymentsInner() {
  const { identity, authMethod } = useAuth();
  const [page, setPage] = useState(0);

  const prev = page > 0 ? BigInt(page * CONFIG.PAGE_SIZE) : undefined;
  const { data: payments, isPending, isError } = useUserPayments({
    identity,
    authMethod,
    prev,
  });

  return (
    <div>
      <h2 className="text-3xl font-bold text-emerald-400 mb-2">My Payments</h2>
      <p className="text-slate-400 mb-6">View your subscription payment history.</p>

      {isPending && <LoadingSpinner />}
      {isError && <p className="text-red-400">Failed to load payments.</p>}

      {payments && <PaymentTable payments={payments} />}

      {/* Pagination */}
      {payments && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            ← Previous
          </button>
          <span className="text-sm text-slate-400">Page {page + 1}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={payments.length < CONFIG.PAGE_SIZE}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export function MyPayments() {
  return (
    <AuthGuard>
      <MyPaymentsInner />
    </AuthGuard>
  );
}
