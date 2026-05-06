import { useState, useRef } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { PrincipalDisplay } from './PrincipalDisplay';

export function LoginButton() {
  const { isAuthenticated, isLoading, principal, authMethod, login, loginPlug, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openMenu() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setShowMenu(true);
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setShowMenu(false), 150);
  }

  if (isLoading) {
    return <div className="h-8 w-20 bg-slate-700 rounded animate-pulse" />;
  }

  if (isAuthenticated && principal) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 uppercase">{authMethod}</span>
        <PrincipalDisplay principal={principal} />
        <button
          onClick={logout}
          className="px-3 py-1.5 text-xs bg-slate-700 border border-slate-600 rounded text-slate-300 hover:bg-slate-600 transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  if (isAuthenticated && !principal) {
    // Plug connected but principal not yet shown
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 uppercase">plug</span>
        <button
          onClick={logout}
          className="px-3 py-1.5 text-xs bg-slate-700 border border-slate-600 rounded text-slate-300 hover:bg-slate-600 transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="relative" onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="px-3 py-1.5 text-sm bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
      >
        Login
      </button>
      {showMenu && (
        <div
          className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50"
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
        >
          <button
            onClick={() => { setShowMenu(false); login(); }}
            className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 rounded-t-lg transition-colors"
          >
            Internet Identity
          </button>
          <button
            onClick={() => { setShowMenu(false); loginPlug(); }}
            className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 rounded-b-lg transition-colors border-t border-slate-700"
          >
            Plug Wallet
          </button>
        </div>
      )}
    </div>
  );
}
