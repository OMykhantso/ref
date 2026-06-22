import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { ROLE_LABELS, can } from '../../utils/constants.js';

const NAV = [
  { to: '/', label: 'Дашборд', icon: '📊', perm: 'dashboard:read' },
  { to: '/transactions', label: 'Транзакції', icon: '💸', perm: 'tx:read' },
  { to: '/accounts', label: 'Рахунки', icon: '🏦', perm: 'dashboard:read' },
  { to: '/categories', label: 'Категорії', icon: '🏷️', perm: 'tx:read' },
  { to: '/rates', label: 'Курси валют', icon: '💱', perm: 'rate:read' },
  { to: '/reports', label: 'Звіти', icon: '📑', perm: 'report:read' },
  { to: '/users', label: 'Користувачі', icon: '👥', role: 'OWNER' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((n) =>
    n.role ? user?.role === n.role : can(user?.role, n.perm)
  );

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 md:static md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5 dark:border-slate-800">
          <span className="text-xl">💼</span>
          <span className="font-bold">Фінанси бізнесу</span>
        </div>
        <nav className="space-y-1 p-3">
          {items.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <span>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <button className="md:hidden" onClick={() => setOpen(true)}>☰</button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <button onClick={toggle} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" title="Тема">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <div className="text-right">
              <div className="text-sm font-medium">{user?.name}</div>
              <div className="text-xs text-slate-500">{ROLE_LABELS[user?.role]}</div>
            </div>
            <button onClick={handleLogout} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
              Вихід
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
