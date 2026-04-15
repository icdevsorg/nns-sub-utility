import { CONFIG } from '../config';

export function Footer() {
  return (
    <footer className="bg-slate-800 border-t border-slate-700 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-slate-400">
        <p>
          ICRC-79 Subscription Payments — Powered by{' '}
          <a
            href="https://internetcomputer.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Internet Computer
          </a>
        </p>
        <p className="mt-1">
          <a
            href={`https://dashboard.internetcomputer.org/canister/${CONFIG.SUBS_CANISTER_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            View on IC Dashboard
          </a>
        </p>
      </div>
    </footer>
  );
}
