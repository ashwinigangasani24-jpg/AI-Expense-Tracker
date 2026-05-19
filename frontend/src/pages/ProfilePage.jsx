import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import { Card } from '../components/Card.jsx';
import { Button } from '../components/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { DEFAULT_CURRENCY } from '../utils/currency.js';
import { formatMoney } from '../utils/format.js';

const CURRENCIES = [
  { code: 'INR', label: 'Indian Rupee (₹)' },
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
];

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || DEFAULT_CURRENCY);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setCurrency(user.currency || DEFAULT_CURRENCY);
    setAvatarUrl(user.avatarUrl || '');
  }, [user]);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.patch('/users/profile', { name, currency, avatarUrl });
      setUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Profile</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Amounts across the app use your chosen currency. Default is Indian Rupees (INR).
        </p>
      </div>
      <Card title="Account">
        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm font-medium">
            Display name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="block text-sm font-medium">
            Currency
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Preview: {formatMoney(1234.5, currency)}
            </p>
          </label>
          <label className="block text-sm font-medium">
            Avatar URL (optional)
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
