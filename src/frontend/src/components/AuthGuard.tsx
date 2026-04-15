import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { LoadingSpinner } from './LoadingSpinner';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-300 mb-4">Authentication Required</h2>
        <p className="text-slate-400 mb-6">Please log in with Internet Identity or Plug Wallet to access this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
