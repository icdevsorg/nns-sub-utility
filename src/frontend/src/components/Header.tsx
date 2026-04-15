import { NavLink } from 'react-router-dom';
import { LoginButton } from './LoginButton';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/subscribe', label: 'Subscribe' },
  { to: '/subscriptions', label: 'My Subs' },
  { to: '/payments', label: 'Payments' },
  { to: '/service', label: 'Service' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/about', label: 'About' },
];

export function Header() {
  return (
    <header className="bg-slate-800 border-b border-slate-700">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-emerald-400 shrink-0">ICRC-79 Subscriptions</h1>
        <div className="flex items-center gap-4 overflow-x-auto">
          <nav className="flex gap-3 sm:gap-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-emerald-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <LoginButton />
        </div>
      </div>
    </header>
  );
}
