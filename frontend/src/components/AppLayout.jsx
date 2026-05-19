import { NavLink, Outlet, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  List,
  BarChart3,
  User,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { Button } from './Button.jsx';

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`;

export function AppLayout() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const { dark, toggle } = useTheme();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 space-y-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Ledger<span className="text-brand-600">AI</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Smart expense intelligence</p>
            </div>
            <nav className="space-y-1">
              <NavLink to="/" end className={linkClass}>
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </NavLink>
              <NavLink to="/upload" className={linkClass}>
                <Receipt className="h-4 w-4" /> Scan receipt
              </NavLink>
              <NavLink to="/expenses" className={linkClass}>
                <List className="h-4 w-4" /> Expenses
              </NavLink>
              <NavLink to="/analytics" className={linkClass}>
                <BarChart3 className="h-4 w-4" /> Analytics
              </NavLink>
              <NavLink to="/profile" className={linkClass}>
                <User className="h-4 w-4" /> Profile
              </NavLink>
            </nav>
            <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="text-xs text-slate-500">Signed in as</div>
              <div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {user?.name}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={toggle} type="button">
                  {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" className="flex-1" onClick={logout} type="button">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="mb-6 flex items-center justify-between lg:hidden">
            <div className="font-display text-lg font-bold">
              Ledger<span className="text-brand-600">AI</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={toggle} type="button">
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" onClick={logout} type="button">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <div className="mb-6 flex flex-wrap gap-2 lg:hidden">
            <NavLink
              to="/"
              end
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold shadow dark:bg-slate-900"
            >
              Home
            </NavLink>
            <NavLink
              to="/upload"
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold shadow dark:bg-slate-900"
            >
              Scan
            </NavLink>
            <NavLink
              to="/expenses"
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold shadow dark:bg-slate-900"
            >
              Expenses
            </NavLink>
            <NavLink
              to="/analytics"
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold shadow dark:bg-slate-900"
            >
              Analytics
            </NavLink>
            <NavLink
              to="/profile"
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold shadow dark:bg-slate-900"
            >
              Profile
            </NavLink>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
