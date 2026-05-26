import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/Card.jsx';
import { Button } from '../components/Button.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await register({ name, email, password });
      toast.success('Account created! Please log in.');
      nav('/login');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-50 px-4 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Join Ledger<span className="text-brand-600">AI</span>
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Multi-user ready — your data stays isolated per account.
          </p>
        </div>
        <Card>
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Password (min 8 chars)
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Creating…' : 'Create account'}
            </Button>
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link className="font-semibold text-brand-600 hover:underline" to="/login">
                Sign in
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
